import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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

  createOrUpdateNote() {
    if (!this.title.trim() || !this.content.trim()) {
      this.toastr.warning('Please enter both title and content.', 'Validation');
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
