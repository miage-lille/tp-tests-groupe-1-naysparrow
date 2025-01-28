import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaWebinarRepository } from './webinar-repository.prisma';
import { Webinar } from '../entities/webinar.entity';

const asyncExec = promisify(exec);

describe('PrismaWebinarRepository', () => {
  let postgresContainer: any;
  let prismaClient: PrismaClient;
  let repository: PrismaWebinarRepository;

  beforeAll(async () => {
    try {
      // Configuration Docker pour Windows
      process.env.DOCKER_HOST = 'tcp://localhost:2375';
      process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE =
        '/var/run/docker.sock';

      postgresContainer = await new PostgreSqlContainer()
        .withDatabase('test_db')
        .withUsername('user_test')
        .withPassword('password_test')
        .withExposedPorts(5432)
        .start();

      const dbUrl = postgresContainer.getConnectionUri();

      prismaClient = new PrismaClient({
        datasources: {
          db: { url: dbUrl },
        },
      });

      await asyncExec(
        `cross-env DATABASE_URL=${dbUrl} npx prisma migrate deploy`,
      );
      await prismaClient.$connect();
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  }, 30000); // Timeout augmenté pour le beforeAll

  beforeEach(async () => {
    repository = new PrismaWebinarRepository(prismaClient);
    await prismaClient.webinar.deleteMany();
  });

  afterAll(async () => {
    try {
      if (prismaClient) {
        await prismaClient.$disconnect();
      }
      if (postgresContainer) {
        await postgresContainer.stop();
      }
    } catch (error) {
      console.error('Error in afterAll:', error);
    }
  });

  describe('Scenario : repository.create', () => {
    it('should create a webinar', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-01T00:00:00Z'),
        endDate: new Date('2022-01-01T01:00:00Z'),
        seats: 100,
      });

      await repository.create(webinar);

      const maybeWebinar = await prismaClient.webinar.findUnique({
        where: { id: 'webinar-id' },
      });
      expect(maybeWebinar).toEqual({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-01T00:00:00Z'),
        endDate: new Date('2022-01-01T01:00:00Z'),
        seats: 100,
      });
    });
  });

  describe('Scenario : repository.findById', () => {
    it('should find a webinar by id', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-01T00:00:00Z'),
        endDate: new Date('2022-01-01T01:00:00Z'),
        seats: 100,
      });

      await repository.create(webinar);

      const foundWebinar = await repository.findById('webinar-id');
      expect(foundWebinar).toEqual(webinar);
    });
  });

  describe('Scenario : repository.update', () => {
    it('should update a webinar', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-01T00:00:00Z'),
        endDate: new Date('2022-01-01T01:00:00Z'),
        seats: 100,
      });

      await repository.create(webinar);

      webinar.update({ seats: 200 });
      await repository.update(webinar);

      const updatedWebinar = await prismaClient.webinar.findUnique({
        where: { id: 'webinar-id' },
      });
      expect(updatedWebinar?.seats).toEqual(200);
    });
  });
});
