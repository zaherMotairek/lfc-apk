import { Controller, Get } from '@nestjs/common';

@Controller()
export class ApiRootController {
  @Get()
  root() {
    return {
      message: 'Kop Platform API — OLSC Lebanon',
      status: 'ok',
      docs: {
        health: '/api/health',
        authLogin: 'POST /api/auth/login',
        publicCms: 'GET /api/cms/pages/HOME',
      },
      webApp: 'Use the Vite dev server (e.g. http://localhost:5173), not this URL in the browser.',
    };
  }
}
