import { Router } from "express";

class AppRouter {
  private static router: Router;

  constructor() {
    AppRouter.router = Router();
  }

  static getRouter(): Router {
    if (!AppRouter.router) {
      AppRouter.router = Router();
    }

    return AppRouter.router;
  }
}

export { AppRouter };
