import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'

@Component({
    templateUrl: './downloads.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadsDialogComponent implements OnInit {
    links = [];

    constructor(
        private readonly dialogRef: MatDialogRef<DownloadsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) { }

    ngOnInit(): void {
        const { reference, module } = this.data;

        if (!reference) return;

        for (const content of reference[module]) {
            const key = Object.keys(content)[0];
            this.links.push([key, content[key]]);
        }
    }

    async onCancel(): Promise<void> {
        this.dialogRef.close()
    }
}
