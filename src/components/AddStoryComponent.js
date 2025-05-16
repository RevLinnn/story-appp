import MapComponent from "./MapComponent.js";

export default class AddStoryComponent {
  constructor(container, addStoryCallback) {
    this.container = container;
    this.addStoryCallback = addStoryCallback;
    this.videoStream = null;
    this.videoEl = null;
    this.canvasEl = null;
    this.photoBlob = null;
    this.selectedLat = undefined;
    this.selectedLon = undefined;
  }

  render() {
    this.container.innerHTML = `
            <h2>Tambah Cerita Baru</h2>
            <form id="form-add-story">
                <label for="description">Deskripsi:</label>
                <input type="text" id="description" name="description" aria-required="true" required />
                <label for="photo">Upload Foto:</label>
                <input type="file" id="photo" name="photo" accept="image/*" aria-required="true" />
                <button type="button" id="btn-start-camera">Ambil Foto dengan Kamera</button>
                <div id="camera-stream" style="display:none; margin-top: 12px;">
                    <video id="video" autoplay muted playsinline style="max-width: 100%; border-radius: 6px;"></video>
                    <canvas id="canvas" style="display:none;"></canvas>
                    <div style="margin-top: 10px;">
                        <button type="button" id="btn-capture">Ambil Gambar</button>
                        <button type="button" id="btn-stop-camera">Berhenti Kamera</button>
                        <button type="button" id="btn-retake-photo" style="display:none; margin-left: 8px;">Ulangi Foto</button>
                    </div>
                </div>
                <label style="margin-top: 12px;">Pilih Lokasi Cerita (klik di peta):</label>
                <div id="map-add" role="region" aria-label="Peta untuk memilih lokasi cerita"></div>
                <p id="location-info" style="margin-top: 8px; font-size: 14px; color: #555;"></p>
                <button type="submit">Kirim Cerita</button>
            </form>
            <div id="preview-container"></div>
        `;

    this.videoEl = this.container.querySelector("#video");
    this.canvasEl = this.container.querySelector("#canvas");

    this.container
      .querySelector("#btn-start-camera")
      .addEventListener("click", () => this.startCamera());
    this.container
      .querySelector("#btn-capture")
      .addEventListener("click", () => this.capturePhoto());
    this.container
      .querySelector("#btn-stop-camera")
      .addEventListener("click", () => this.stopCamera());
    this.container
      .querySelector("#btn-retake-photo")
      .addEventListener("click", () => this.retakePhoto());
    this.container
      .querySelector("#form-add-story")
      .addEventListener("submit", (e) => this.submitForm(e));

    this.map = new MapComponent("map-add", {
      center: [-0.7893, 113.9213],
      zoom: 5,
      onClick: (e) => this.handleMapClick(e),
    });
  }

  async startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        this.videoEl.srcObject = this.videoStream;
        this.videoEl.style.display = "block";
        this.container.querySelector("#camera-stream").style.display = "block";
      } catch (err) {
        alert("Tidak bisa mengakses kamera: " + err.message);
      }
    } else {
      alert("Browser Anda tidak mendukung fitur kamera.");
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
    }
    this.container.querySelector("#btn-retake-photo").style.display = "none";
    this.videoEl.style.display = "none";
    this.container.querySelector("#camera-stream").style.display = "none";
  }

  capturePhoto() {
    const width = this.videoEl.videoWidth;
    const height = this.videoEl.videoHeight;
    this.canvasEl.width = width;
    this.canvasEl.height = height;
    const ctx = this.canvasEl.getContext("2d");
    ctx.drawImage(this.videoEl, 0, 0, width, height);

    this.canvasEl.toBlob((blob) => {
      this.photoBlob = blob;
      this.showPreviewOnCamera(blob);
      if (this.videoStream) {
        this.videoStream.getTracks().forEach((track) => track.stop());
        this.videoStream = null;
      }
      this.videoEl.style.display = "none";
    }, "image/jpeg");
  }

  showPreviewOnCamera(blob) {
    const cameraStream = this.container.querySelector("#camera-stream");
    cameraStream.style.display = "block";

    const oldPreview = cameraStream.querySelector("img");
    if (oldPreview) oldPreview.remove();

    const imgPreview = document.createElement("img");
    imgPreview.src = URL.createObjectURL(blob);
    imgPreview.alt = "Preview Gambar";
    imgPreview.style.maxWidth = "40%";
    imgPreview.style.borderRadius = "6px";
    imgPreview.style.marginTop = "10px";
    imgPreview.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";

    cameraStream.appendChild(imgPreview);
    this.container.querySelector("#btn-retake-photo").style.display =
      "inline-block";
  }

  retakePhoto() {
    const cameraStream = this.container.querySelector("#camera-stream");
    const previewImage = cameraStream.querySelector("img");
    if (previewImage) previewImage.remove();

    this.container.querySelector("#btn-retake-photo").style.display = "none";
    this.videoEl.style.display = "block";
    this.startCamera();
  }

  handleMapClick({ latlng }) {
    this.selectedLat = latlng.lat;
    this.selectedLon = latlng.lng;

    const popupText = `Latitude: ${this.selectedLat.toFixed(
      6
    )}, Longitude: ${this.selectedLon.toFixed(6)}`;
    this.map.addMarker(this.selectedLat, this.selectedLon, popupText);

    const locationInfo = this.container.querySelector("#location-info");
    locationInfo.textContent = popupText;
  }

  async submitForm(event) {
    event.preventDefault();

    const descriptionInput = this.container.querySelector("#description");
    const photoInput = this.container.querySelector("#photo");

    const description = descriptionInput.value.trim();
    if (!description) {
      alert("Deskripsi wajib diisi");
      return;
    }

    let photoFile = null;
    if (this.photoBlob) {
      photoFile = this.photoBlob;
    } else if (photoInput.files.length > 0) {
      photoFile = photoInput.files[0];
      if (!photoFile.type.startsWith("image/")) {
        alert("File harus berupa gambar");
        return;
      }
    } else {
      alert("Foto wajib di-upload atau diambil menggunakan kamera");
      return;
    }

    if (photoFile.size > 1024 * 1024) {
      alert("Ukuran foto maksimal 1MB");
      return;
    }

    if (this.selectedLat === undefined || this.selectedLon === undefined) {
      alert("Silakan pilih lokasi cerita di peta");
      return;
    }

    this.addStoryCallback({
      description,
      photoBlob: photoFile,
      lat: this.selectedLat,
      lon: this.selectedLon,
    });

    descriptionInput.value = "";
    photoInput.value = "";
    this.photoBlob = null;
    this.selectedLat = undefined;
    this.selectedLon = undefined;

    this.container.querySelector("#preview-container").innerHTML = "";
    this.container.querySelector("#location-info").textContent = "";
    this.map.clearMarker?.();

    this.stopCamera();
  }
}
