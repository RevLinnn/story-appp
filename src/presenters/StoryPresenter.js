import StoryListComponent from "../components/StoryListComponent.js";
import AddStoryComponent from "../components/AddStoryComponent.js";

export default class StoryPresenter {
  constructor(container, model) {
    this.container = container;
    this.model = model;

    // Tambahkan log untuk memeriksa apakah model memiliki metode fetchStories
    console.log("Model:", this.model);
    console.log("Model fetchStories:", typeof this.model.fetchStories);
  }

  async route(page) {
    switch (page) {
      case "stories":
        await this.showStoriesPage();
        break;
      case "add-story":
        this.showAddStoryPage();
        break;
      default:
        this.showNotFound();
        break;
    }
  }

  async showStoriesPage() {
    try {
      const stories = await this.model.fetchStories();
      const listComponent = new StoryListComponent(this.container, stories);
      listComponent.render();
    } catch (error) {
      this.container.innerHTML = `<p>Gagal memuat cerita: ${error.message}</p>`;
    }
  }

  showAddStoryPage() {
    const addComponent = new AddStoryComponent(this.container, (data) =>
      this.addStory(data)
    );
    addComponent.render();
  }

  async addStory(data) {
    try {
      await this.model.addStory(data);
      alert("Cerita berhasil ditambahkan!");
      window.location.hash = "#/stories";
    } catch (error) {
      alert("Gagal menambahkan cerita: " + error.message);
    }
  }

  showNotFound() {
    this.container.innerHTML = "<p>Halaman tidak ditemukan.</p>";
  }
}
