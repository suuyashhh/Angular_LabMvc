import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

@Injectable({
  providedIn: 'root',
})
export class FileReaderService {
  constructor() {}

  // Read and modify DOCX
  async updateDocxFile(selectedOffice: string) {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun('कार्यालयाचे नांव: '),
                new TextRun({ text: selectedOffice, bold: true }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'Updated_Document.docx');
  }
}
