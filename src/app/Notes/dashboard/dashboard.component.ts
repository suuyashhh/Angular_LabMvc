import {
  Component, OnInit, OnDestroy, inject, ViewEncapsulation,
  HostListener, ViewChild, ElementRef, Renderer2
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { JoditAngularModule } from 'jodit-angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface NoteFileDto {
  fileId: number;
  folderId: number;
  displayName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  downloadCount: number;
  createdDate: string;
  updatedDate?: string;
}

export interface NoteFileDetail extends NoteFileDto {
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  status: string;
}

export interface NoteFolder {
  folderId: number;
  userId: number;
  parentFolderId?: number | null;
  folderName: string;
  subFolders: NoteFolder[];
  pages: NotePageDto[];
  files: NoteFileDto[];
  expanded?: boolean;
}

export interface NotePageDto {
  pageId: number;
  folderId: number;
  title: string;
}

export interface NotePage {
  pageId: number;
  folderId: number;
  userId: number;
  title: string;
  content: string;
  createdDate: string;
  updatedDate: string;
}

// ─── File type helpers ────────────────────────────────────────────────────────

const FILE_ICON_MAP: Record<string, string> = {
  // Documents
  '.pdf'  : 'ri-file-pdf-2-line',
  '.doc'  : 'ri-file-word-line',
  '.docx' : 'ri-file-word-line',
  '.xls'  : 'ri-file-excel-line',
  '.xlsx' : 'ri-file-excel-line',
  '.ppt'  : 'ri-file-ppt-line',
  '.pptx' : 'ri-file-ppt-line',
  '.txt'  : 'ri-file-text-line',
  '.csv'  : 'ri-file-chart-line',
  '.json' : 'ri-braces-line',
  '.xml'  : 'ri-code-line',
  '.md'   : 'ri-markdown-line',
  '.rtf'  : 'ri-file-text-line',
  // Images
  '.jpg'  : 'ri-image-line',
  '.jpeg' : 'ri-image-line',
  '.png'  : 'ri-image-line',
  '.webp' : 'ri-image-line',
  '.gif'  : 'ri-image-2-line',
  '.svg'  : 'ri-svg-fill',
  // Archives
  '.zip'  : 'ri-file-zip-line',
  '.rar'  : 'ri-file-zip-line',
  '.7z'   : 'ri-file-zip-line',
  // Media
  '.mp4'  : 'ri-video-line',
  '.mp3'  : 'ri-music-line',
};

const FILE_COLOR_MAP: Record<string, string> = {
  '.pdf' : '#e53e3e',
  '.doc' : '#2b5fdb', '.docx': '#2b5fdb',
  '.xls' : '#276749', '.xlsx': '#276749',
  '.ppt' : '#d65d0e', '.pptx': '#d65d0e',
  '.txt' : '#718096', '.rtf' : '#718096', '.md': '#718096',
  '.csv' : '#2f855a',
  '.json': '#744210', '.xml': '#744210',
  '.jpg' : '#9b2c2c', '.jpeg': '#9b2c2c', '.png': '#9b2c2c',
  '.webp': '#9b2c2c', '.gif' : '#9b2c2c', '.svg': '#9b2c2c',
  '.zip' : '#553c9a', '.rar' : '#553c9a', '.7z' : '#553c9a',
  '.mp4' : '#1a365d',
  '.mp3' : '#44337a',
};

@Component({
  selector: 'app-notes-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, JoditAngularModule, SafeHtmlPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  folderTree: NoteFolder[] = [];

  isSidebarOpen: boolean = true;

  // Search
  searchQuery: string = '';
  searchResults: { folders: any[], pages: any[], files: NoteFileDto[] } = { folders: [], pages: [], files: [] };
  isSearching: boolean = false;

  // Selected State — only ONE of selectedPage / selectedFile can be active
  selectedPage: NotePage | null = null;
  selectedFile: NoteFileDetail | null = null;
  isEditingPage: boolean = false;
  breadcrumb: string[] = [];

  // Modals / Dialogs
  showAddFolderModal: boolean = false;
  showAddPageModal: boolean = false;

  newFolderName: string = '';
  newPageTitle: string = '';
  targetFolderIdForAdd: number | null = null;

  // File upload state
  isUploadingFiles: boolean = false;
  uploadProgress: number = 0;
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  // File rename inline
  isRenamingFile: boolean = false;
  fileRenameValue: string = '';

  // Safe preview URL for PDF / image inline viewer
  safePreviewUrl: SafeResourceUrl | null = null;
  previewType: 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'none' = 'none';
  textPreviewContent: string = '';

  // Single-document architecture: Jodit is always mounted; we only
  // toggle readonly. The reference is held here for syncEditableState().
  @ViewChild('joditRef', { static: false }) joditRef?: any;

  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);
  private scaleRetryTimer?: ReturnType<typeof setTimeout>;
  private wysiwygResizeObserver?: ResizeObserver;

  // Editor Config — readonly starts true; enterEditMode() flips it false
  joditConfig: any = {
    height: 'auto',
    minHeight: 1056,
    readonly: true,
    toolbarAdaptive: false,
    hidePoweredByJodit: true,
    statusbar: false,
    uploader: { insertImageAsBase64URI: true },
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html',
    placeholder: 'Write Your Content Here....',
    style: {
      fontFamily: 'Times New Roman',
      fontSize: '16px'
    },
    controls: {
      font: {
        list: {
          'Times New Roman, Times, serif': 'Times New Roman',
          'Roboto,sans-serif': 'Roboto',
          'Arial,Helvetica,sans-serif': 'Arial',
        }
      }
    }
  };

  // Context Menu
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuFolder: NoteFolder | null = null;

  // File context menu
  fileContextMenuVisible = false;
  fileContextMenuX = 0;
  fileContextMenuY = 0;
  fileContextMenuTarget: NoteFileDto | null = null;

  private http = inject(HttpClient);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private loader = inject(LoaderService);
  private toastr = inject(ToastrService);

  ngOnInit() {
    this.currentUser = this.auth.getNotesUser();
    this.loadTree();
    document.addEventListener('click', () => {
      this.contextMenuVisible = false;
      this.fileContextMenuVisible = false;
    });
  }

  ngOnDestroy() {
    this.wysiwygResizeObserver?.disconnect();
    if (this.scaleRetryTimer) clearTimeout(this.scaleRetryTimer);
  }

  @HostListener('window:resize')
  onResize() {
    this.applyPageScaling();
  }

  // ============================================================
  // Tree / Folder / Page loading
  // ============================================================

  loadTree() {
    if (!this.currentUser) return;
    this.loader.show();
    this.http.get<NoteFolder[]>(`${this.api.baseurl}NotesExplorer/tree/${this.currentUser.id}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res) => {
          // Preserve expanded state across reloads
          this.mergeExpandedState(res, this.folderTree);
          this.folderTree = res;
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to load explorer.', 'Error');
        }
      });
  }

  /** Preserve expanded state when tree is reloaded */
  private mergeExpandedState(newNodes: NoteFolder[], oldNodes: NoteFolder[]) {
    const oldMap = new Map(oldNodes.map(n => [n.folderId, n]));
    for (const node of newNodes) {
      const old = oldMap.get(node.folderId);
      if (old) node.expanded = old.expanded;
      if (node.subFolders?.length) {
        this.mergeExpandedState(node.subFolders, old?.subFolders ?? []);
      }
    }
  }

  // ============================================================
  // Folder Actions
  // ============================================================

  openContextMenu(event: MouseEvent, folder: NoteFolder) {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuFolder = folder;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
    this.fileContextMenuVisible = false;
  }

  openAddFolderModal(parentFolderId: number | null) {
    this.targetFolderIdForAdd = parentFolderId;
    this.newFolderName = '';
    this.showAddFolderModal = true;
  }

  createFolder() {
    if (!this.newFolderName.trim()) {
      this.toastr.warning('Folder name is required.');
      return;
    }
    const payload = {
      userId: this.currentUser.id,
      parentFolderId: this.targetFolderIdForAdd,
      folderName: this.newFolderName.trim()
    };
    this.loader.show();
    this.http.post(`${this.api.baseurl}NotesExplorer/folders`, payload)
      .pipe(finalize(() => { this.loader.hide(); this.showAddFolderModal = false; }))
      .subscribe({
        next: () => { this.toastr.success('Folder created.'); this.loadTree(); },
        error: () => this.toastr.error('Failed to create folder.')
      });
  }

  deleteFolder(folder: NoteFolder) {
    const hasContent = (folder.subFolders?.length > 0) || (folder.pages?.length > 0) || (folder.files?.length > 0);
    if (hasContent) {
      if (!confirm('This folder contains pages, files, and/or subfolders. You must delete all contents first before deleting the folder.')) return;
      return; // block
    }
    if (!confirm('Are you sure you want to delete this folder?')) return;

    this.loader.show();
    this.http.delete(`${this.api.baseurl}NotesExplorer/folders/${folder.folderId}/user/${this.currentUser.id}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: () => {
          this.toastr.success('Folder deleted.');
          if (this.selectedPage && this.breadcrumb.includes(folder.folderName)) {
            this.selectedPage = null;
          }
          if (this.selectedFile && this.selectedFile.folderId === folder.folderId) {
            this.selectedFile = null;
          }
          this.loadTree();
        },
        error: (err) => this.toastr.error(err.error || 'Failed to delete folder.')
      });
  }

  renameFolder(folder: NoteFolder) {
    const newName = prompt('Enter new folder name:', folder.folderName);
    if (newName && newName.trim() && newName.trim() !== folder.folderName) {
      this.loader.show();
      this.http.put(`${this.api.baseurl}NotesExplorer/folders`, {
        folderId: folder.folderId,
        userId: this.currentUser.id,
        folderName: newName.trim()
      }).pipe(finalize(() => this.loader.hide()))
        .subscribe({
          next: () => { this.toastr.success('Folder renamed.'); this.loadTree(); },
          error: () => this.toastr.error('Failed to rename folder.')
        });
    }
  }

  // ============================================================
  // Page Actions
  // ============================================================

  openAddPageModal(folderId: number) {
    this.targetFolderIdForAdd = folderId;
    this.newPageTitle = '';
    this.showAddPageModal = true;
  }

  createPage() {
    if (!this.newPageTitle.trim()) {
      this.toastr.warning('Page title is required.');
      return;
    }
    const payload = {
      userId: this.currentUser.id,
      folderId: this.targetFolderIdForAdd,
      title: this.newPageTitle.trim(),
      content: ''
    };
    this.loader.show();
    this.http.post<NotePage>(`${this.api.baseurl}NotesExplorer/pages`, payload)
      .pipe(finalize(() => { this.loader.hide(); this.showAddPageModal = false; }))
      .subscribe({
        next: (res) => {
          this.toastr.success('Page created.');
          this.loadTree();
          this.openPage(res.pageId);
        },
        error: () => this.toastr.error('Failed to create page.')
      });
  }

  openPage(pageId: number) {
    this.loader.show();
    this.http.get<NotePage>(`${this.api.baseurl}NotesExplorer/pages/${pageId}/user/${this.currentUser.id}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res) => {
          this.selectedPage = res;
          this.selectedFile = null;
          this.safePreviewUrl = null;
          this.isEditingPage = false;
          this.buildBreadcrumb(this.folderTree, res.folderId, []);

          if (window.innerWidth < 1024) {
            this.isSidebarOpen = false;
          }

          // After Angular renders the Jodit element, push content + readonly state
          setTimeout(() => this.initEditorObservers(), 0);
        },
        error: () => this.toastr.error('Failed to load page.')
      });
  }

  buildBreadcrumb(nodes: NoteFolder[], targetFolderId: number, currentPath: string[]): boolean {
    for (let node of nodes) {
      if (node.folderId === targetFolderId) {
        this.breadcrumb = [...currentPath, node.folderName];
        return true;
      }
      if (node.subFolders && node.subFolders.length > 0) {
        if (this.buildBreadcrumb(node.subFolders, targetFolderId, [...currentPath, node.folderName])) {
          return true;
        }
      }
    }
    return false;
  }

  // ============================================================
  // Edit mode toggling — ONLY changes readonly state, never the DOM
  // ============================================================

  enterEditMode() {
    if (!this.selectedPage) return;
    this.isEditingPage = true;
    this.syncEditableState();
  }

  cancelEdit() {
    if (!this.selectedPage) return;
    const pageId = this.selectedPage.pageId;
    this.isEditingPage = false;
    this.openPage(pageId); // reload from server to discard changes
  }

  savePage() {
    if (!this.selectedPage) return;
    this.loader.show();
    this.http.put(`${this.api.baseurl}NotesExplorer/pages`, this.selectedPage)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: () => {
          this.toastr.success('Page saved.');
          this.isEditingPage = false;
          this.syncEditableState();
          this.loadTree();
        },
        error: () => this.toastr.error('Failed to save page.')
      });
  }

  deletePage(pageId: number) {
    if (!confirm('This action cannot be undone. Are you sure you want to permanently delete this page?')) return;
    this.loader.show();
    this.http.delete(`${this.api.baseurl}NotesExplorer/pages/${pageId}/user/${this.currentUser.id}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: () => {
          this.toastr.success('Page deleted.');
          this.selectedPage = null;
          this.loadTree();
        },
        error: () => this.toastr.error('Failed to delete page.')
      });
  }

  onEditorChange(data: any) {
    if (!this.selectedPage) return;
    if (typeof data === 'string') {
      this.selectedPage.content = data;
    } else if (data && data.editor) {
      this.selectedPage.content = data.editor.value;
    } else if (data && data.html) {
      this.selectedPage.content = data.html;
    }
  }

  // ============================================================
  // File Upload Actions
  // ============================================================

  triggerFileUpload(folderId: number) {
    this.targetFolderIdForAdd = folderId;
    // Use a small timeout so the context menu hides before the picker opens
    setTimeout(() => {
      this.fileInputRef?.nativeElement?.click();
    }, 50);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const folderId = this.targetFolderIdForAdd;
    if (!folderId) {
      this.toastr.error('No folder selected.');
      return;
    }

    const files = Array.from(input.files);

    // Client-side pre-validation
    const maxSize = 52_428_800; // 50 MB
    for (const f of files) {
      if (f.size > maxSize) {
        this.toastr.error(`"${f.name}" exceeds the 50 MB limit.`);
        input.value = '';
        return;
      }
    }

    this.uploadFiles(folderId, files);
    input.value = ''; // reset so same file can be re-selected
  }

  uploadFiles(folderId: number, files: File[]) {
    const formData = new FormData();
    formData.append('folderId', folderId.toString());
    formData.append('userId', this.currentUser.id.toString());
    files.forEach(f => formData.append('files', f, f.name));

    this.isUploadingFiles = true;
    this.loader.show();

    this.http.post<NoteFileDetail[]>(`${this.api.baseurl}NoteFile/upload`, formData)
      .pipe(finalize(() => { this.loader.hide(); this.isUploadingFiles = false; }))
      .subscribe({
        next: (res) => {
          this.toastr.success(`${res.length} file(s) uploaded successfully.`);
          this.loadTree();
        },
        error: (err) => {
          const msg = err?.error || 'File upload failed.';
          this.toastr.error(typeof msg === 'string' ? msg : 'File upload failed.');
        }
      });
  }

  // ============================================================
  // File Actions — open, rename, delete, download
  // ============================================================

  openFile(fileId: number) {
    this.loader.show();
    this.http.get<NoteFileDetail>(`${this.api.baseurl}NoteFile/${fileId}/user/${this.currentUser.id}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res) => {
          this.selectedFile = res;
          this.selectedPage = null;
          this.isEditingPage = false;
          this.isRenamingFile = false;
          this.fileRenameValue = res.displayName;

          // Build breadcrumb
          this.buildBreadcrumb(this.folderTree, res.folderId, []);

          this.setupFilePreview(res);

          if (window.innerWidth < 1024) {
            this.isSidebarOpen = false;
          }
        },
        error: () => this.toastr.error('Failed to load file details.')
      });
  }

  private setupFilePreview(file: NoteFileDetail) {
    const ext = file.extension.toLowerCase();
    const previewUrl = `${this.api.baseurl}NoteFile/preview/${file.fileId}/user/${this.currentUser.id}`;

    if (['.pdf'].includes(ext)) {
      this.previewType = 'pdf';
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
      this.previewType = 'image';
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
    } else if (['.mp4'].includes(ext)) {
      this.previewType = 'video';
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
    } else if (['.mp3'].includes(ext)) {
      this.previewType = 'audio';
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
    } else if (['.txt', '.csv', '.json', '.xml', '.md', '.rtf'].includes(ext)) {
      this.previewType = 'text';
      this.safePreviewUrl = null;
      this.textPreviewContent = 'Loading...';
      // Fetch raw text
      this.http.get(previewUrl, { responseType: 'text' }).subscribe({
        next: (text) => this.textPreviewContent = text,
        error: () => this.textPreviewContent = '(Unable to load file text)'
      });
    } else {
      this.previewType = 'none';
      this.safePreviewUrl = null;
    }
  }

  downloadFile(file: NoteFileDetail | NoteFileDto) {
    const url = `${this.api.baseurl}NoteFile/download/${file.fileId}/user/${this.currentUser.id}`;
    // Create a temporary link to force download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.displayName}${file.extension}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  shareFile(file: NoteFileDetail | NoteFileDto) {
    if (!navigator.share || !navigator.canShare) {
      this.toastr.warning('Your browser does not support native file sharing.');
      return;
    }

    const url = `${this.api.baseurl}NoteFile/download/${file.fileId}/user/${this.currentUser.id}`;
    this.loader.show();
    this.toastr.info('Preparing file for sharing...');
    
    this.http.get(url, { responseType: 'blob' })
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: async (blob) => {
          try {
            const fileName = `${file.displayName}${file.extension}`;
            const shareFile = new File([blob], fileName, { type: file.mimeType });
            
            if (navigator.canShare({ files: [shareFile] })) {
              await navigator.share({
                title: file.displayName,
                text: 'Check out this file from Notes Explorer.',
                files: [shareFile]
              });
              this.toastr.success('File shared successfully.');
            } else {
              this.toastr.warning('Your system does not support sharing this type of file.');
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error('Share failed:', err);
              this.toastr.error('Failed to share the file.');
            }
          }
        },
        error: () => this.toastr.error('Failed to download the file for sharing.')
      });
  }

  startRenameFile() {
    if (!this.selectedFile) return;
    this.isRenamingFile = true;
    this.fileRenameValue = this.selectedFile.displayName;
  }

  cancelRenameFile() {
    this.isRenamingFile = false;
    this.fileRenameValue = this.selectedFile?.displayName ?? '';
  }

  saveRenameFile() {
    if (!this.selectedFile || !this.fileRenameValue.trim()) return;
    const newName = this.fileRenameValue.trim();
    if (newName === this.selectedFile.displayName) { this.isRenamingFile = false; return; }

    this.loader.show();
    this.http.put(`${this.api.baseurl}NoteFile/rename`, {
      fileId: this.selectedFile.fileId,
      userId: this.currentUser.id,
      newDisplayName: newName
    }).pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          this.toastr.success('File renamed.');
          this.selectedFile!.displayName = res.newDisplayName;
          this.isRenamingFile = false;
          this.loadTree();
        },
        error: () => this.toastr.error('Failed to rename file.')
      });
  }

  deleteFile(file: NoteFileDetail | NoteFileDto) {
    if (!confirm(`Delete "${file.displayName}${file.extension}"? This cannot be undone.`)) return;
    this.loader.show();
    this.http.delete(`${this.api.baseurl}NoteFile/${file.fileId}/user/${this.currentUser.id}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: () => {
          this.toastr.success('File deleted.');
          if (this.selectedFile?.fileId === file.fileId) {
            this.selectedFile = null;
            this.safePreviewUrl = null;
          }
          this.loadTree();
        },
        error: () => this.toastr.error('Failed to delete file.')
      });
  }

  // File context menu (right-click on file in sidebar)
  openFileContextMenu(event: MouseEvent, file: NoteFileDto) {
    event.preventDefault();
    event.stopPropagation();
    this.fileContextMenuTarget = file;
    this.fileContextMenuX = event.clientX;
    this.fileContextMenuY = event.clientY;
    this.fileContextMenuVisible = true;
    this.contextMenuVisible = false;
  }

  // ============================================================
  // File Utilities
  // ============================================================

  getFileIcon(extension: string): string {
    return FILE_ICON_MAP[extension?.toLowerCase()] ?? 'ri-file-line';
  }

  getFileColor(extension: string): string {
    return FILE_COLOR_MAP[extension?.toLowerCase()] ?? '#718096';
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  isImageFile(ext: string): boolean {
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext?.toLowerCase());
  }

  isPdfFile(ext: string): boolean {
    return ext?.toLowerCase() === '.pdf';
  }

  isVideoFile(ext: string): boolean {
    return ext?.toLowerCase() === '.mp4';
  }

  isAudioFile(ext: string): boolean {
    return ext?.toLowerCase() === '.mp3';
  }

  isTextFile(ext: string): boolean {
    return ['.txt', '.csv', '.json', '.xml', '.md', '.rtf'].includes(ext?.toLowerCase());
  }

  isPreviewable(ext: string): boolean {
    return this.isImageFile(ext) || this.isPdfFile(ext) || this.isVideoFile(ext) ||
           this.isAudioFile(ext) || this.isTextFile(ext);
  }

  // ============================================================
  // Sidebar / Search / Misc
  // ============================================================

  toggleFolder(folder: NoteFolder, event: Event) {
    event.stopPropagation();
    folder.expanded = !folder.expanded;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    setTimeout(() => this.applyPageScaling(), 320);
  }

  onSearchChange() {
    if (!this.searchQuery.trim()) {
      this.isSearching = false;
      this.searchResults = { folders: [], pages: [], files: [] };
      return;
    }
    this.isSearching = true;
    this.http.get<any>(`${this.api.baseurl}NotesExplorer/search/${this.currentUser.id}?query=${encodeURIComponent(this.searchQuery)}`)
      .subscribe({
        next: (res) => {
          this.searchResults = {
            folders: res.folders ?? [],
            pages: res.pages ?? [],
            files: res.files ?? []
          };
        }
      });
  }

  logout() {
    this.auth.notesLogout();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }

  // ============================================================
  // Single-document helpers
  // ============================================================

  /** Returns the live Jodit DOM nodes. */
  private getJoditNodes(): { wysiwyg: HTMLElement | null, workplace: HTMLElement | null, container: HTMLElement | null } {
    const wrapper = this.joditRef?.elementRef?.nativeElement as HTMLElement | undefined;
    if (!wrapper) return { wysiwyg: null, workplace: null, container: null };
    return {
      wysiwyg: wrapper.querySelector('.jodit-wysiwyg') as HTMLElement | null,
      workplace: wrapper.querySelector('.jodit-workplace') as HTMLElement | null,
      container: wrapper.querySelector('.jodit-container') as HTMLElement | null,
    };
  }

  /** @deprecated use getJoditNodes */
  private getWysiwyg(): HTMLElement | null {
    return this.getJoditNodes().wysiwyg;
  }

  /**
   * Called once after a page is loaded. Waits for Jodit to finish mounting
   * its internal DOM (it's async), then wires up the ResizeObserver and
   * applies the initial readonly + scaling state.
   */
  private initEditorObservers(attempt: number = 0) {
    const { wysiwyg, container } = this.getJoditNodes();
    if (!wysiwyg || !container) {
      if (attempt > 40) return; // ~2s timeout
      this.scaleRetryTimer = setTimeout(() => this.initEditorObservers(attempt + 1), 50);
      return;
    }

    // Re-scale whenever the content height changes (typing, images loading…)
    this.wysiwygResizeObserver?.disconnect();
    this.wysiwygResizeObserver = new ResizeObserver(() => this.applyPageScaling());
    this.wysiwygResizeObserver.observe(wysiwyg);

    this.syncEditorContent();
    this.syncEditableState(true);
    this.applyPageScaling();
  }

  /**
   * Pushes the new page content into the Jodit instance when switching pages.
   */
  private syncEditorContent() {
    const instance = this.joditRef?.jodit || this.joditRef?.editor || this.joditRef?.instance;
    if (instance && this.selectedPage) {
      instance.value = this.selectedPage.content || '';
    }
  }

  /**
   * Scales the wysiwyg page (816 px wide) to fit the available width —
   * like zooming a Google Docs page. The toolbar is NOT scaled so it stays
   * fully legible on any screen size.
   *
   * On MOBILE (< 769px) we skip scaling entirely and let the CSS media
   * query switch the wysiwyg to full-width fluid layout so text remains
   * readable. Tables inside get their own horizontal scroll.
   *
   * On DESKTOP we use container.clientWidth (the outer .jodit-container
   * which is 100 % wide), NOT workplace.clientWidth which expands to 816 px
   * and always returns 816, breaking the scale calculation.
   */
  private applyPageScaling() {
    const { wysiwyg, workplace, container } = this.getJoditNodes();
    if (!wysiwyg || !workplace || !container) return;

    // Mobile: restore natural layout (CSS handles it via @media)
    if (window.innerWidth < 769) {
      this.renderer.removeStyle(wysiwyg, 'transform');
      this.renderer.removeStyle(wysiwyg, 'transform-origin');
      this.renderer.removeStyle(workplace, 'height');
      this.renderer.removeStyle(workplace, 'overflow-x');
      return;
    }

    // Desktop: scale page down if the sidebar is open and squeezes the area
    const availableWidth = container.clientWidth;
    if (!availableWidth) return;

    const PAGE_WIDTH = 816;
    const scale = Math.min(1, availableWidth / PAGE_WIDTH);

    this.renderer.setStyle(wysiwyg, 'transform', `scale(${scale})`);
    this.renderer.setStyle(wysiwyg, 'transform-origin', 'top center');

    // Clip horizontal overflow from the scaled page but keep vertical visible
    // so only the outer .page-scroll scrollbar is ever shown.
    this.renderer.setStyle(workplace, 'overflow-x', 'hidden');
    this.renderer.setStyle(workplace, 'overflow-y', 'visible');

    // Compensate height so content below isn't pushed down by the ghost space
    // that CSS transform leaves behind (transform doesn't affect layout flow)
    const naturalHeight = wysiwyg.scrollHeight;
    this.renderer.setStyle(workplace, 'height', `${Math.ceil(naturalHeight * scale)}px`);
  }

  /**
   * Toggles Jodit between read-only and editable WITHOUT recreating
   * or destroying the editor DOM — this is the core of the single-document
   * architecture. The document stays visible and layout-stable at all times.
   */
  private syncEditableState(force: boolean = false) {
    const { wysiwyg } = this.getJoditNodes();
    if (!wysiwyg) return;

    this.renderer.setAttribute(wysiwyg, 'contenteditable', this.isEditingPage ? 'true' : 'false');

    // Also tell Jodit's internal API so toolbar/shortcuts agree
    const instance = this.joditRef?.jodit || this.joditRef?.editor || this.joditRef?.instance;
    if (instance) {
      try {
        if (typeof instance.setReadOnly === 'function') {
          instance.setReadOnly(!this.isEditingPage);
        } else {
          instance.readonly = !this.isEditingPage;
        }
      } catch {
        // contenteditable attribute above still covers essential behavior
      }
    }
  }
}