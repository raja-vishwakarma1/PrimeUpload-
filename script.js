const STORAGE_KEY = 'primeUploadData';

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('uploadForm')) {
        initUploadPage();
    } else if (document.getElementById('loadingScreen')) {
        loadPreviewPage();
    }
    
    updateUploadCount();
});

function initUploadPage() {
    setupFileInputs();
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
}

function setupFileInputs() {
    const inputs = document.querySelectorAll('input[type="file"]');
    
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            const label = this.closest('.file-label');
            const preview = document.getElementById(this.id + 'Preview');
            
            if (this.files[0]) {
                label.classList.add('has-file');
                if (preview) showPreview(this.files[0], preview);
            }
        });
    });
}

function showPreview(file, preview) {
    preview.classList.remove('hidden');
    const filename = preview.querySelector('.preview-filename');
    filename.textContent = file.name;
    
    if (file.type.startsWith('video/')) {
        const video = preview.querySelector('.preview-video');
        video.src = URL.createObjectURL(file);
    } else {
        const iframe = preview.querySelector('.preview-pdf');
        iframe.src = URL.createObjectURL(file);
    }
}

async function handleUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const btn = e.target.querySelector('.upload-btn');
    const progress = btn.querySelector('.progress-fill');
    const originalHTML = btn.innerHTML;
    
    btn.disabled = true;
    progress.parentElement.classList.remove('hidden');
    
    // Animate progress
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 15;
        if (width > 90) width = 90;
        progress.style.width = width + '%';
    }, 200);
    
    try {
        const data = {
            id: Date.now().toString(),
            video: formData.get('video') ? await toBase64(formData.get('video')) : null,
            pdf: formData.get('pdf') ? await toBase64(formData.get('pdf')) : null,
            category: formData.get('category'),
            priority: formData.get('priority'),
            videoName: formData.get('video')?.name,
            pdfName: formData.get('pdf')?.name,
            timestamp: new Date().toISOString()
        };
        
        saveData(data);
        showToast('🚀 Upload completed successfully!', 'success');
        setTimeout(() => window.location.href = 'details.html', 1500);
        
    } catch (error) {
        showToast('❌ Upload failed: ' + error.message, 'error');
    } finally {
        clearInterval(interval);
        progress.style.width = '100%';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            progress.parentElement.classList.add('hidden');
        }, 1000);
    }
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function saveData(data) {
    const uploads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    uploads.unshift(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads.slice(0, 10)));
}

function loadPreviewPage() {
    const uploads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const latest = uploads[0];
    
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        
        if (latest) {
            renderPreview(latest);
        } else {
            document.getElementById('emptyState').classList.remove('hidden');
        }
    }, 1500);
}

function renderPreview(data) {
    const grid = document.getElementById('previewGrid');
    grid.innerHTML = `
        <div class="preview-card">
            <div class="media-preview">
                ${data.video ? `<video controls src="${data.video}"></video>` : 
                    data.pdf ? `<iframe src="${data.pdf}"></iframe>` : 
                    '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;"><i class="fas fa-file" style="font-size:4rem;"></i></div>'}
            </div>
            <div>
                <h3 style="margin-bottom:1rem;color:#f8fafc;font-size:1.3rem;">${data.videoName || data.pdfName || 'Upload'}</h3>
                <div class="meta-tags">
                    <span class="tag">${data.category}</span>
                    <span class="tag">${data.priority}</span>
                </div>
                <div style="margin-top:1rem;font-size:0.9rem;color:#94a3b8;">
                    <i class="fas fa-clock"></i> ${new Date(data.timestamp).toLocaleString('en-IN')}
                </div>
            </div>
        </div>
    `;
    grid.classList.remove('hidden');
}

function updateUploadCount() {
    const count = (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).length;
    const counter = document.getElementById('uploadCount');
    if (counter) counter.textContent = count;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 4000);
}

function clearForm() {
    document.getElementById('uploadForm').reset();
    document.querySelectorAll('.file-label').forEach(el => el.classList.remove('has-file'));
    document.querySelectorAll('.preview-area').forEach(el => el.classList.add('hidden'));
}

function clearAllData() {
    if (confirm('Delete all uploads?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}