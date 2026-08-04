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

export interface NoteFolder {
  folderId: number;
  userId: number;
  parentFolderId?: number | null;
  folderName: string;
  subFolders: NoteFolder[];
  pages: NotePageDto[];
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
  searchResults: { folders: any[], pages: any[] } = { folders: [], pages: [] };
  isSearching: boolean = false;

  // Selected State
  selectedPage: NotePage | null = null;
  isEditingPage: boolean = false;
  breadcrumb: string[] = [];

  // Modals / Dialogs
  showAddFolderModal: boolean = false;
  showAddPageModal: boolean = false;

  newFolderName: string = '';
  newPageTitle: string = '';
  targetFolderIdForAdd: number | null = null;

  // Single-document architecture: Jodit is always mounted; we only
  // toggle readonly. The reference is held here for syncEditableState().
  @ViewChild('joditRef', { static: false }) joditRef?: any;

  private renderer = inject(Renderer2);
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
        next: (res) => { this.folderTree = res; },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to load explorer.', 'Error');
        }
      });
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
    if (folder.subFolders?.length > 0 || folder.pages?.length > 0) {
      if (!confirm('This folder contains pages and subfolders. Deleting it will permanently remove everything inside. This action cannot be undone. Delete Folder?')) return;
    } else {
      if (!confirm('Are you sure you want to delete this folder?')) return;
    }
    this.loader.show();
    this.http.delete(`${this.api.baseurl}NotesExplorer/folders/${folder.folderId}/user/${this.currentUser.id}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: () => {
          this.toastr.success('Folder deleted.');
          if (this.selectedPage && this.breadcrumb.includes(folder.folderName)) {
            this.selectedPage = null;
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
      this.searchResults = { folders: [], pages: [] };
      return;
    }
    this.isSearching = true;
    this.http.get<any>(`${this.api.baseurl}NotesExplorer/search/${this.currentUser.id}?query=${encodeURIComponent(this.searchQuery)}`)
      .subscribe({ next: (res) => { this.searchResults = res; } });
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

    this.syncEditableState(true);
    this.applyPageScaling();
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