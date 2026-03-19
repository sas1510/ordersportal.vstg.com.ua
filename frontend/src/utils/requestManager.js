// Глобальний менеджер для відслідковування активних запитів
class RequestManager {
  constructor() {
    this.controllers = new Set();
  }

  createController() {
    const controller = new AbortController();
    this.controllers.add(controller);
    return controller;
  }

  cancel(controller) {
    if (controller) {
      controller.abort();
      this.controllers.delete(controller);
    }
  }

  cancelAll() {
    for (const c of this.controllers) {
      c.abort();
    }
    this.controllers.clear();
  }
}

export const requestManager = new RequestManager();
