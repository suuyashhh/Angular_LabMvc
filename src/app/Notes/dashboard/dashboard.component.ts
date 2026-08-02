import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
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
interface NoteItem {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdDate: string;
}

@Component({
  selector: 'app-notes-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, JoditAngularModule, SafeHtmlPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {
  activeTab: 'home' | 'paste' = 'home';
  title = '';
  content = '';
  searchQuery = '';
  notes: NoteItem[] = [];
  editingNoteId: number | null = null;
  selectedNote: NoteItem | null = null;
  currentUser: any = null;
  joditConfig = {
    height: 400,
    uploader: {
      insertImageAsBase64URI: true
    },
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html',
    placeholder: 'Write Your Content Here....',
    controls: {
      font: {
        list: {
          'Roboto,sans-serif': 'Roboto',
          'Arial,Helvetica,sans-serif': 'Arial',
        }
      }
    }
  };

  private http = inject(HttpClient);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private loader = inject(LoaderService);
  private toastr = inject(ToastrService);

  ngOnInit() {
    this.currentUser = this.auth.getNotesUser();
    this.loadNotes();
  }

  setTab(tab: 'home' | 'paste') {
    this.activeTab = tab;
  }

  loadNotes() {
    if (!this.currentUser) return;
    this.loader.show();
    this.http.get<NoteItem[]>(`${this.api.baseurl}Notes/user/${this.currentUser.id}`, {
      params: { searchQuery: this.searchQuery }
    })
    .pipe(finalize(() => this.loader.hide()))
    .subscribe({
      next: (res) => {
        this.notes = res;
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load notes.', 'Error');
      }
    });
  }

  onSearchChange() {
    this.loadNotes();
  }

  onEditorChange(data: any) {
    if (typeof data === 'string') {
      this.content = data;
    } else if (data && data.editor) {
      this.content = data.editor.value;
    } else if (data && data.html) {
      this.content = data.html;
    }
  }

  createOrUpdateNote() {
    const hasText = this.content ? this.content.replace(/<[^>]*>/g, '').trim().length > 0 : false;
    const hasImage = this.content ? this.content.includes('<img') : false;
    
    const isTitleEmpty = !this.title || this.title.trim() === '';
    const isContentEmpty = !hasText && !hasImage;

    if (isTitleEmpty || isContentEmpty) {
      if (isTitleEmpty && isContentEmpty) {
         this.toastr.warning('Please enter both title and content.', 'Validation');
      } else if (isTitleEmpty) {
         this.toastr.warning('Please enter a title for your paste.', 'Validation');
      } else {
         this.toastr.warning('Please enter some content for your paste.', 'Validation');
      }
      return;
    }

    if (!this.currentUser) return;

    this.loader.show();

    if (this.editingNoteId) {
      // Update Mode
      const payload = {
        id: this.editingNoteId,
        userId: this.currentUser.id,
        title: this.title,
        content: this.content
      };

      this.http.put(`${this.api.baseurl}Notes`, payload)
        .pipe(finalize(() => this.loader.hide()))
        .subscribe({
          next: () => {
            this.toastr.success('Paste updated successfully!', 'Success');
            this.clearForm();
            this.loadNotes();
            this.setTab('paste');
          },
          error: (err) => {
            console.error(err);
            this.toastr.error(err?.error?.message || 'Failed to update paste.', 'Error');
          }
        });
    } else {
      // Create Mode
      const payload = {
        userId: this.currentUser.id,
        title: this.title,
        content: this.content
      };

      this.http.post(`${this.api.baseurl}Notes`, payload)
        .pipe(finalize(() => this.loader.hide()))
        .subscribe({
          next: () => {
            this.toastr.success('Paste created successfully!', 'Success');
            this.clearForm();
            this.loadNotes();
            this.setTab('paste');
          },
          error: (err) => {
            console.error(err);
            this.toastr.error(err?.error?.message || 'Failed to create paste.', 'Error');
          }
        });
    }
  }

  editNote(note: NoteItem) {
    this.title = note.title;
    this.content = note.content;
    this.editingNoteId = note.id;
    this.setTab('home');
  }

  deleteNote(noteId: number) {
    if (!this.currentUser) return;
    if (!confirm('Are you sure you want to delete this paste?')) return;

    this.loader.show();
    this.http.delete(`${this.api.baseurl}Notes/${noteId}/user/${this.currentUser.id}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: () => {
          this.toastr.success('Paste deleted successfully.', 'Deleted');
          this.loadNotes();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to delete paste.', 'Error');
        }
      });
  }

  viewNote(note: NoteItem) {
    this.selectedNote = note;
  }

  closeView() {
    this.selectedNote = null;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toastr.success('Copied to clipboard!', 'Copied');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }

  clearForm() {
    this.title = '';
    this.content = '';
    this.editingNoteId = null;
  }

  logout() {
    this.auth.notesLogout();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
