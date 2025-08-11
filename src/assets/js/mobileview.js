
// Carousel functionality
const imageIndex = {
    chatverse: 1,
    pictoria: 1,
    Dairy:1
};

function showImage(project, index) {
    const images = document.querySelectorAll(`#${project}-img-1, #${project}-img-2, #${project}-img-3,#${project}-img-4`);
    images.forEach((img, i) => {
        img.style.opacity = (i + 1 === index) ? "1" : "0";
    });
}

function nextImage(project) {
    imageIndex[project]++;
    if (imageIndex[project] > 4) imageIndex[project] = 1;
    showImage(project, imageIndex[project]);
}

function prevImage(project) {
    imageIndex[project]--;
    if (imageIndex[project] < 1) imageIndex[project] = 4;
    showImage(project, imageIndex[project]);
}

// Initialize images
document.addEventListener('DOMContentLoaded', () => {
    showImage('chatverse', 1);
    showImage('pictoria', 1);
    showImage('Dairy', 1);
});


// Download PDF function
function downloadPDF() {
    const link = document.createElement('a');
    link.href = '../../../assets/img/SuyashPatilResume.pdf';
    link.download = 'SuyashPatilResume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Handle PDF load
function handlePDFLoad() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Open PDF in new tab
function openInNewTab() {
    window.open('../../../assets/img/SuyashPatilResume.pdff', '_blank');
}

// Hide loading overlay after a timeout (fallback)
setTimeout(() => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}, 3000);

// Add smooth scroll behavior
document.addEventListener('DOMContentLoaded', function () {
    // Additional PDF viewer enhancements
    const pdfViewer = document.getElementById('pdfViewer');

    // Handle iframe load errors
    if (pdfViewer) {
        pdfViewer.onerror = function () {
            console.log('PDF failed to load in iframe');
            // Show fallback content
            const fallback = document.createElement('div');
            fallback.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-96 bg-slate-100 text-slate-600">
                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="w-16 h-16 mb-4 text-slate-400">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10,9 9,9 8,9"></polyline>
                            </svg>
                            <p class="text-lg mb-4">Unable to display PDF in browser.</p>
                            <p class="mb-6">Please download the PDF to view it:</p>
                            <button onclick="downloadPDF()" class="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg transition-colors">
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path>
                                </svg>
                                Download PDF
                            </button>
                        </div>
                    `;
            pdfViewer.parentNode.replaceChild(fallback, pdfViewer);
        };
    }

    console.log('Resume viewer loaded successfully');
});