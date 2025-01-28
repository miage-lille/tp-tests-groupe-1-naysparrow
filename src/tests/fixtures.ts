import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { FastifyInstance, fastify } from 'fastify';
import { container } from 'src/container';
import { webinarRoutes } from 'src/webinars/routes';
import { promisify } from 'util';

const asyncExec = promisify(exec);

export class TestServerFixture {
  private postgresContainer: any;
  private prismaClient: PrismaClient;
  private server: FastifyInstance;

  constructor() {
    this.server = fastify();
    this.prismaClient = new PrismaClient();
  }

  async init() {
    try {
      // Configuration Docker pour Windows
      process.env.DOCKER_HOST = 'tcp://localhost:2375';
      process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE =
        '/var/run/docker.sock';

      this.postgresContainer = await new PostgreSqlContainer()
        .withDatabase('test_db')
        .withUsername('user_test')
        .withPassword('password_test')
        .withExposedPorts(5432)
        .start();

      const dbUrl = this.postgresContainer.getConnectionUri();

      this.prismaClient = new PrismaClient({
        datasources: {
          db: { url: dbUrl },
        },
      });

      await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
      await this.prismaClient.$connect();

      container.init(this.prismaClient);
      await webinarRoutes(this.server, container);
    } catch (error) {
      console.error('Error initializing fixture:', error);
      throw error;
    }
  }

  getPrismaClient() {
    return this.prismaClient;
  }

  getServer() {
    return this.server.server;
  }

  async stop() {
    try {
      await this.server.close();
      await this.prismaClient.$disconnect();
      if (this.postgresContainer) {
        await this.postgresContainer.stop();
      }
    } catch (error) {
      console.error('Error stopping fixture:', error);
    }
  }

  async reset() {
    await this.prismaClient.webinar.deleteMany();
  }
}
