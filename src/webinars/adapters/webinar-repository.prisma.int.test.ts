import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaWebinarRepository } from './webinar-repository.prisma';
import { Webinar } from '../entities/webinar.entity';
import { TestServerFixture } from 'src/tests/fixtures';

const asyncExec = promisify(exec);

describe('PrismaWebinarRepository', () => {
  let repository: PrismaWebinarRepository;
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    repository = new PrismaWebinarRepository(fixture.getPrismaClient());
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
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

      const maybeWebinar = await fixture.getPrismaClient().webinar.findUnique({
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

      const updatedWebinar = await fixture
        .getPrismaClient()
        .webinar.findUnique({
          where: { id: 'webinar-id' },
        });
      expect(updatedWebinar?.seats).toEqual(200);
    });
  });
});
