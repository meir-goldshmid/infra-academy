window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };

// ---------------------------------------------------------------------------
// NestJS in depth, NestJS + DDD + event-driven, and choosing an observability
// stack (Datadog, VictoriaMetrics, Grafana).
// Code blocks are shared between the English and Hebrew bodies.
// ---------------------------------------------------------------------------

(function () {
  const I = window.INFRA;

  /* ============================ Lesson 1 code ============================ */

  const C_MODULES = `<pre>// orders/orders.module.ts: a feature module
@Module({
  imports: [PaymentsModule],                  // PaymentsModule must EXPORT PaymentsClient
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],                   // the module's public API; everything else is private
})
export class OrdersModule {}

// database/database.module.ts: a dynamic module configured at import time
export const PG_POOL = Symbol('PG_POOL');

@Module({})
export class DatabaseModule {
  static forRootAsync(): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,                           // one pool for the whole app, no re-imports
      imports: [ConfigModule],
      providers: [{
        provide: PG_POOL,
        inject: [ConfigService],
        useFactory: async (cfg: ConfigService): Promise&lt;Pool&gt; =&gt; {
          const pool = new Pool({ connectionString: cfg.getOrThrow('DATABASE_URL'), max: 10 });
          await pool.query('SELECT 1');       // fail at boot, not on the first request
          return pool;
        },
      }],
      exports: [PG_POOL],
    };
  }
}

// app.module.ts
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule.forRootAsync(), OrdersModule] })
export class AppModule {}</pre>`;

  const C_PROVIDERS = `<pre>export abstract class Clock { abstract now(): Date; }   // abstract class = DI token AND type

@Module({
  providers: [
    { provide: Clock, useClass: SystemClock },                          // swap for a FakeClock in tests
    { provide: 'FEATURE_FLAGS', useValue: { newCheckout: false } },      // constants, config objects
    { provide: PaymentsClient,                                          // needs runtime config
      inject: [ConfigService, HttpService],
      useFactory: (cfg: ConfigService, http: HttpService) =&gt;
        new PaymentsClient(http, cfg.getOrThrow('PAYMENTS_URL')) },
    { provide: 'LegacyOrders', useExisting: OrdersService },             // alias, same instance
  ],
})

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,      // symbol/string token needs @Inject
    private readonly clock: Clock,                      // class token: inferred from the type
    @Optional() @Inject('FEATURE_FLAGS') private readonly flags?: Flags,
  ) {}
}

@Injectable({ scope: Scope.REQUEST })                   // NEW instance per HTTP request
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly req: Request) {}
  get tenantId(): string { return String(this.req.headers['x-tenant-id']); }
}</pre>`;

  const C_PIPELINE = `<pre>request
  -&gt; middleware            (Express/Fastify level: helmet, request-id, raw body)
  -&gt; guards                (may this caller hit this route? true / throw 401/403)
  -&gt; interceptors: before  (start timer, open span, read cache)
  -&gt; pipes                 (validate + transform @Body/@Param/@Query)
  -&gt; route handler         (controller method)
  -&gt; interceptors: after   (map response, log latency, timeout)
  -&gt; exception filters     (any throw above, turned into an HTTP response)
response

Binding order inside one stage: global -&gt; controller -&gt; route.
Exception filters resolve the other way: route -&gt; controller -&gt; global (most specific wins).</pre>`;

  const C_GUARD = `<pre>export const IS_PUBLIC = 'isPublic';
export const Public = () =&gt; SetMetadata(IS_PUBLIC, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise&lt;boolean&gt; {
    const isPublic = this.reflector.getAllAndOverride&lt;boolean&gt;(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException();
    try {
      // JwtModule is registered with the IdP public key; pin the algorithm and issuer
      req.user = await this.jwt.verifyAsync(token, { algorithms: ['RS256'], issuer: 'https://auth.example.com/' });
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

// app.module.ts: global guard that tests can still override
providers: [JwtAuthGuard, { provide: APP_GUARD, useExisting: JwtAuthGuard }]</pre>`;

  const C_INTERCEPTOR = `<pre>@Injectable()
export class LoggingTimeoutInterceptor implements NestInterceptor {
  private readonly log = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable&lt;unknown&gt; {
    const req = ctx.switchToHttp().getRequest();
    const start = performance.now();                      // everything up to next.handle() = "before"
    return next.handle().pipe(                            // everything in pipe() = "after"
      timeout(5000),                                      // 5 s budget for the handler
      catchError(err =&gt; throwError(() =&gt;
        err instanceof TimeoutError ? new RequestTimeoutException() : err)),
      finalize(() =&gt; this.log.log(
        req.method + ' ' + req.url + ' ' + Math.round(performance.now() - start) + 'ms')),
    );
  }
}</pre>`;

  const C_PIPE = `<pre>export class OrderLineDto {
  @IsString() @Length(3, 32) sku: string;
  @IsInt() @Min(1) @Max(100) qty: number;
}

export class CreateOrderDto {
  @IsUUID() customerId: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50)
  @ValidateNested({ each: true }) @Type(() =&gt; OrderLineDto)    // without @Type nested objects are NOT validated
  lines: OrderLineDto[];
  @IsOptional() @IsString() @MaxLength(200) note?: string;
}

// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // strip properties without decorators
  forbidNonWhitelisted: true,   // ...or reject them with 400 (blocks mass assignment: "isAdmin": true)
  transform: true,              // plain JSON -&gt; CreateOrderDto instance, "42" -&gt; 42 for typed @Param
}));

@Post()
create(@Body() dto: CreateOrderDto, @Param('id', ParseUUIDPipe) id: string) { /* ... */ }</pre>`;

  const C_FILTER = `<pre>@Catch(OrderAlreadyPaidError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(err: OrderAlreadyPaidError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse&lt;Response&gt;();
    res.status(409).type('application/problem+json').json({   // RFC 9457 problem details
      type: 'https://errors.example.com/order-already-paid',
      title: 'Order already paid',
      status: 409,
      detail: err.message,
    });
  }
}
// register: app.useGlobalFilters(new DomainErrorFilter())  or  { provide: APP_FILTER, useClass: DomainErrorFilter }</pre>`;

  const C_OPS = `<pre>// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  validationSchema: Joi.object({                 // crash at boot on bad config, not at 3 a.m.
    DATABASE_URL: Joi.string().uri().required(),
    PORT: Joi.number().default(3000),
    JWT_ISSUER: Joi.string().uri().required(),
  }),
}),
TerminusModule.forRoot({ gracefulShutdownTimeoutMs: 5000 }),

// health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService, private readonly db: TypeOrmHealthIndicator) {}

  @Public() @Get('live') @HealthCheck()
  live() { return this.health.check([]); }                 // process is up; never check the DB here

  @Public() @Get('ready') @HealthCheck()
  ready() { return this.health.check([() =&gt; this.db.pingCheck('db', { timeout: 1000 })]); }
}

// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableShutdownHooks();          // SIGTERM -&gt; onModuleDestroy -&gt; beforeApplicationShutdown
                                      //         -&gt; HTTP server closes -&gt; onApplicationShutdown
  await app.listen(Number(process.env.PORT ?? 3000));
}

// any provider
@Injectable()
export class KafkaPublisher implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string) { await this.producer.disconnect(); }  // flush, then exit
}</pre>
<pre># deployment.yaml (excerpt)
spec:
  terminationGracePeriodSeconds: 30         # must exceed preStop + drain + hook time
  containers:
    - name: orders
      command: ["node", "dist/main.js"]     # NOT "npm start": npm does not forward SIGTERM reliably
      lifecycle:
        preStop: { sleep: { seconds: 5 } }  # let endpoints/LB drop the Pod before we stop accepting
      readinessProbe: { httpGet: { path: /health/ready, port: 3000 }, periodSeconds: 5 }
      livenessProbe:  { httpGet: { path: /health/live,  port: 3000 }, periodSeconds: 10, failureThreshold: 3 }</pre>`;

  const C_TEST = `<pre>// orders.service.spec.ts: unit test with the real DI container, fake edges
describe('OrdersService', () =&gt; {
  let service: OrdersService;
  const repo = { save: jest.fn(), findById: jest.fn() };

  beforeEach(async () =&gt; {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: repo },
        { provide: Clock, useValue: { now: () =&gt; new Date('2026-01-01T00:00:00Z') } },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  it('rejects an empty order', async () =&gt; {
    await expect(service.place({ customerId: 'c1', lines: [] })).rejects.toThrow(EmptyOrderError);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

// orders.e2e-spec.ts: whole module graph, real pipes and filters
const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(PaymentsClient).useValue({ charge: jest.fn().mockResolvedValue({ ok: true }) })
  .overrideProvider(JwtAuthGuard).useValue({ canActivate: () =&gt; true })   // works because APP_GUARD uses useExisting
  .compile();
const app = moduleRef.createNestApplication();
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })); // main.ts is NOT run
await app.init();
await request(app.getHttpServer()).post('/orders').send({ customerId: 'not-a-uuid', lines: [] }).expect(400);
await app.close();</pre>`;

  /* ============================ Lesson 2 code ============================ */

  const C_TREE = `<pre>src/
  main.ts                         # HTTP + broker consumers (hybrid app)
  tracing.ts                      # OpenTelemetry SDK, loaded before anything else
  app.module.ts
  shared/                         # small and boring: no business rules here
    outbox/  outbox.table.ts  outbox.relay.ts
    messaging/  idempotent-consumer.ts  event-envelope.ts
    db/  unit-of-work.ts
  ordering/                       # bounded context = one Nest module
    ordering.module.ts
    domain/                       # pure TypeScript: no ORM, no HTTP, no broker
      order.aggregate.ts
      order-line.vo.ts
      events/order-placed.event.ts  events/order-paid.event.ts
      ports/order.repository.ts   # abstract class = port AND DI token
    application/                  # use cases: orchestrate domain + ports
      commands/place-order.command.ts  commands/place-order.handler.ts
      queries/get-order.query.ts  queries/get-order.handler.ts
      sagas/order.saga.ts
    infrastructure/               # adapters: implement ports
      persistence/order.pg-repository.ts
      messaging/ordering-events.mapper.ts   # domain event -&gt; versioned integration event
    interface/                    # driving adapters: the ways in
      http/orders.controller.ts  http/dto/place-order.dto.ts
      messaging/payment-events.consumer.ts
  billing/                        # another context; talks to ordering only via events or ordering's exported API
    billing.module.ts
    ...</pre>`;

  const C_AGG = `<pre>// ordering/domain/order.aggregate.ts
export class Order extends AggregateRoot {
  private status: 'PENDING' | 'PAID' | 'CANCELLED' = 'PENDING';
  private constructor(readonly id: string, readonly customerId: string,
                      private readonly lines: OrderLine[], private version = 0) { super(); }

  static place(id: string, customerId: string, lines: OrderLine[]): Order {
    if (lines.length === 0) throw new EmptyOrderError();
    const order = new Order(id, customerId, lines);
    order.apply(new OrderPlaced(id, customerId, order.totalCents()));  // recorded, NOT published yet
    return order;
  }

  markPaid(paymentId: string): void {
    if (this.status !== 'PENDING') throw new OrderNotPayableError(this.id, this.status);  // invariant
    this.status = 'PAID';
    this.version++;
    this.apply(new OrderPaid(this.id, paymentId, this.version));
  }

  totalCents(): number { return this.lines.reduce((s, l) =&gt; s + l.priceCents * l.qty, 0); }
}

// ordering/domain/ports/order.repository.ts
export abstract class OrderRepository {
  abstract findById(id: string, tx?: Tx): Promise&lt;Order | null&gt;;
  abstract save(order: Order, tx: Tx): Promise&lt;void&gt;;     // optimistic lock on version
}</pre>`;

  const C_CQRS = `<pre>// application/commands/place-order.command.ts
export class PlaceOrder extends Command&lt;{ orderId: string }&gt; {        // typed result (@nestjs/cqrs 11)
  constructor(readonly customerId: string, readonly lines: OrderLineInput[]) { super(); }
}

// application/commands/place-order.handler.ts
@CommandHandler(PlaceOrder)
export class PlaceOrderHandler implements ICommandHandler&lt;PlaceOrder&gt; {
  constructor(private readonly uow: UnitOfWork, private readonly orders: OrderRepository,
              private readonly outbox: Outbox) {}

  async execute(cmd: PlaceOrder) {
    return this.uow.run(async (tx) =&gt; {                          // ONE database transaction
      const order = Order.place(randomUUID(), cmd.customerId, cmd.lines.map(OrderLine.from));
      await this.orders.save(order, tx);
      await this.outbox.add(order.getUncommittedEvents(), tx);  // same tx: no dual write
      order.uncommit();
      return { orderId: order.id };
    });
  }
}

// application/queries/get-order.handler.ts: reads skip the aggregate entirely
@QueryHandler(GetOrder)
export class GetOrderHandler implements IQueryHandler&lt;GetOrder&gt; {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async execute(q: GetOrder) {
    const { rows } = await this.pool.query('SELECT * FROM order_summary_view WHERE id = $1', [q.id]);
    return rows[0] ?? null;
  }
}

// application/sagas/order.saga.ts: event in, command out (in-process!)
@Injectable()
export class OrderSaga {
  @Saga()
  orderPaid = (events$: Observable&lt;IEvent&gt;): Observable&lt;ICommand&gt; =&gt;
    events$.pipe(ofType(OrderPaid), map(e =&gt; new ReserveStock(e.orderId)));
}

// interface/http/orders.controller.ts
@Post()
place(@Body() dto: PlaceOrderDto) { return this.commandBus.execute(new PlaceOrder(dto.customerId, dto.lines)); }</pre>`;

  const C_OUTBOX = `<pre>CREATE TABLE outbox (
  id             uuid PRIMARY KEY,                -- becomes the message id consumers dedup on
  aggregate_type text NOT NULL,                   -- 'order'
  aggregate_id   text NOT NULL,                   -- Kafka key / SQS MessageGroupId
  event_type     text NOT NULL,                   -- 'ordering.order-placed.v1'
  payload        jsonb NOT NULL,
  traceparent    text,                            -- W3C trace context captured at write time
  created_at     timestamptz NOT NULL DEFAULT now(),
  published_at   timestamptz
);
CREATE INDEX outbox_unpublished ON outbox (created_at) WHERE published_at IS NULL;

-- relay loop, every 200-500 ms
BEGIN;
SELECT id, aggregate_id, event_type, payload, traceparent
FROM outbox
WHERE published_at IS NULL
ORDER BY created_at
LIMIT 100
FOR UPDATE SKIP LOCKED;            -- a second relay replica skips these rows instead of waiting
-- publish each row, AWAIT broker acks (Kafka acks=all / RabbitMQ publisher confirms)
UPDATE outbox SET published_at = now() WHERE id = ANY($1);
COMMIT;

-- housekeeping (daily)
DELETE FROM outbox WHERE published_at &lt; now() - interval '7 days';</pre>`;

  const C_IDEMP = `<pre>CREATE TABLE processed_messages (
  consumer     text NOT NULL,                  -- 'billing.on-order-placed'
  message_id   uuid NOT NULL,                  -- = outbox.id, stable across redeliveries
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (consumer, message_id)
);</pre>
<pre>// shared/messaging/idempotent-consumer.ts
@Injectable()
export class OnOrderPlaced {
  constructor(private readonly ds: DataSource, private readonly invoices: InvoiceService) {}

  async handle(msg: EventEnvelope&lt;OrderPlacedV1&gt;): Promise&lt;void&gt; {
    await this.ds.transaction(async (tx) =&gt; {
      const inserted = await tx.query(
        'INSERT INTO processed_messages (consumer, message_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING message_id',
        ['billing.on-order-placed', msg.id]);
      if (inserted.length === 0) return;                           // duplicate: already applied, just ack
      await this.invoices.createFor(msg.data.orderId, msg.data.totalCents, tx);  // effect in the SAME tx
    });
  }
}</pre>`;

  const C_TRANSPORTS = `<pre>// main.ts: one process serves HTTP and consumes Kafka (hybrid application)
const app = await NestFactory.create(AppModule);
app.connectMicroservice&lt;MicroserviceOptions&gt;({
  transport: Transport.KAFKA,
  options: {
    client: { clientId: 'billing', brokers: ['kafka-0:9092', 'kafka-1:9092', 'kafka-2:9092'] },
    consumer: { groupId: 'billing' },
    run: { autoCommit: false },                    // commit only after the handler succeeded
  },
});
await app.startAllMicroservices();
await app.listen(3000);

// interface/messaging/order-events.consumer.ts
@Controller()
export class OrderEventsConsumer {
  constructor(private readonly onPlaced: OnOrderPlaced) {}

  @EventPattern('ordering.order-placed.v1')
  async placed(@Payload() msg: EventEnvelope&lt;OrderPlacedV1&gt;, @Ctx() ctx: KafkaContext) {
    await this.onPlaced.handle(msg);               // throws -&gt; no commit -&gt; redelivered
    const { offset } = ctx.getMessage();
    await ctx.getConsumer().commitOffsets([
      { topic: ctx.getTopic(), partition: ctx.getPartition(), offset: (Number(offset) + 1).toString() }]);
  }
}

// RabbitMQ variant: quorum queue, manual ack, broker-side delivery limit -&gt; DLX
{
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://rabbit:5672'],
    queue: 'billing.order-placed',
    noAck: false,
    prefetchCount: 20,
    queueOptions: { durable: true, arguments: {
      'x-queue-type': 'quorum', 'x-delivery-limit': 5, 'x-dead-letter-exchange': 'billing.dlx' } },
  },
}
// in the handler: ctx.getChannelRef().ack(ctx.getMessage())
//            or: ctx.getChannelRef().nack(ctx.getMessage(), false, true)   // requeue, counts toward the limit</pre>`;

  const C_OTEL = `<pre>// tracing.ts: must load BEFORE @nestjs/*, express, pg, kafkajs are imported
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export const otelSdk = new NodeSDK({
  serviceName: 'ordering',                         // or OTEL_SERVICE_NAME
  traceExporter: new OTLPTraceExporter(),          // OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },   // very noisy, rarely useful
  })],
});
otelSdk.start();
// call otelSdk.shutdown() from onApplicationShutdown so the last spans are flushed

// run:  node --require ./dist/tracing.js dist/main.js</pre>
<pre>import { context, propagation, ROOT_CONTEXT, SpanKind, trace } from '@opentelemetry/api';
const tracer = trace.getTracer('ordering');

// 1) write side, inside the command's transaction: capture the caller's trace
const carrier: Record&lt;string, string&gt; = {};
propagation.inject(context.active(), carrier);          // { traceparent: '00-4bf92f35...-00f067aa...-01' }
await tx.query('INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload, traceparent) VALUES ($1,$2,$3,$4,$5,$6)',
  [id, 'order', order.id, 'ordering.order-placed.v1', payload, carrier.traceparent]);

// 2) relay: publish with the STORED context, not the relay loop's own context
await producer.send({ topic: 'ordering.order-placed.v1', acks: -1, messages: rows.map(r =&gt; ({
  key: r.aggregate_id,                                   // same order -&gt; same partition -&gt; ordered
  value: JSON.stringify({ id: r.id, type: r.event_type, data: r.payload }),
  headers: { traceparent: r.traceparent ?? '' },
})) });

// 3) consumer: continue the trace
const parent = propagation.extract(ROOT_CONTEXT, { traceparent: String(headers.traceparent ?? '') });
await context.with(parent, () =&gt;
  tracer.startActiveSpan('ordering.order-placed.v1 process', { kind: SpanKind.CONSUMER }, async (span) =&gt; {
    try { await this.onPlaced.handle(msg); }
    catch (e) { span.recordException(e as Error); throw e; }
    finally { span.end(); }
  }));</pre>`;

  /* ============================ Lesson 3 code ============================ */

  const C_DD_OPERATOR = `<pre>apiVersion: datadoghq.com/v2alpha1
kind: DatadogAgent
metadata:
  name: datadog
  namespace: datadog
spec:
  global:
    site: datadoghq.eu
    clusterName: prod-eu-1
    credentials:
      apiSecret: { secretName: datadog-secret, keyName: api-key }
  features:
    apm:
      enabled: true
      instrumentation: { enabled: true }           # Single Step Instrumentation via the admission controller
    logCollection: { enabled: true, containerCollectAll: false }   # opt in per workload, not "everything"
    dogstatsd: { unixDomainSocketConfig: { enabled: true } }       # UDS: no UDP drops, origin detection
    admissionController: { enabled: true }
    orchestratorExplorer: { enabled: true }
# Result: Node Agent DaemonSet (agent + trace-agent + process-agent containers)
#       + Cluster Agent Deployment (2 replicas, leader-elected)</pre>
<pre># Unified service tagging on every Deployment
metadata:
  labels:
    tags.datadoghq.com/env: prod
    tags.datadoghq.com/service: orders
    tags.datadoghq.com/version: "1.42.0"
spec:
  template:
    metadata:
      labels:
        tags.datadoghq.com/env: prod
        tags.datadoghq.com/service: orders
        tags.datadoghq.com/version: "1.42.0"
    spec:
      containers:
        - name: orders
          env:
            - name: DD_ENV
              valueFrom: { fieldRef: { fieldPath: "metadata.labels['tags.datadoghq.com/env']" } }
            - name: DD_SERVICE
              valueFrom: { fieldRef: { fieldPath: "metadata.labels['tags.datadoghq.com/service']" } }
            - name: DD_VERSION
              valueFrom: { fieldRef: { fieldPath: "metadata.labels['tags.datadoghq.com/version']" } }</pre>`;

  const C_DD_COST = `<pre># One innocent-looking DogStatsD call:
statsd.distribution('http.server.duration', ms, tags=[
  'env:prod', 'service:orders', 'endpoint:' + route, 'status:' + code, 'pod:' + pod_name])

# Unique tag-value combinations:
#   endpoint (40) x status (6) x pod (30)                  =  7,200 series
# A distribution is stored as count/sum/min/max/avg         x 5  = 36,000 custom metrics
# Enable percentiles (p50/p75/p90/p95/p99)                  x 2  = 72,000 custom metrics
# Rolling deploy: pod names change, old + new pods both report in the same hour -&gt; more again

# Same signal, sane tags: drop 'pod' (the Agent already adds host / kube tags you can exclude)
#   endpoint (40) x status (6) = 240 series -&gt; 2,400 with percentiles</pre>`;

  const C_VM_ARCH = `<pre>  apps / exporters / kube-state-metrics
            |  scrape
        vmagent  (relabel, stream aggregation, on-disk buffer if the backend is down)
            |  remote_write
        vmauth   (optional: auth, tenant routing, load balancing)
            |
   vminsert x N   :8480   stateless, shards series by consistent hash
            |
   vmstorage x M  :8400 (from vminsert) :8401 (to vmselect) :8482 (http)   STATEFUL, local disk
            |
   vmselect x K   :8481   stateless, fans out queries, merges, caches
            ^                       ^
         Grafana                vmalert (rules -&gt; Alertmanager; recording rules written back via remote_write)

Single-node mode: one binary "victoria-metrics" on :8428 does all of it.</pre>
<pre># cluster wiring (tenant 0)
vminsert  -storageNode=vmstorage-0:8400,vmstorage-1:8400,vmstorage-2:8400 -replicationFactor=2
vmselect  -storageNode=vmstorage-0:8401,vmstorage-1:8401,vmstorage-2:8401 -dedup.minScrapeInterval=30s
vmstorage -retentionPeriod=13M -storageDataPath=/vmstorage-data

# write URL  http://vminsert:8480/insert/0/prometheus/api/v1/write
# read  URL  http://vmselect:8481/select/0/prometheus           (Grafana "Prometheus" data source)</pre>`;

  const C_METRICSQL = `<pre># Plain PromQL works as-is:
sum by (status) (rate(http_requests_total{job="orders"}[5m]))

# MetricsQL extras:
rate(http_requests_total{job="orders"})            # no [window]: uses the query step automatically
WITH (f = {env="prod", job="orders"})
  sum(rate(http_errors_total{f}[5m])) / sum(rate(http_requests_total{f}[5m]))   # reusable filters
topk_avg(5, sum by (path) (rate(http_requests_total[5m])))   # top 5 by average over the range, stable legend
sum(rate(http_requests_total[5m])) keep_metric_names          # don't drop __name__</pre>`;

  const C_CARD = `<pre># vmagent / Prometheus scrape config: cut cardinality at the edge
metric_relabel_configs:
  - action: labeldrop                          # labels nobody queries
    regex: "pod_template_hash|controller_revision_hash|uid"
  - source_labels: [__name__]                  # whole families you never chart
    regex: "apiserver_request_duration_seconds_bucket|etcd_request_duration_seconds_bucket"
    action: drop
  - source_labels: [path]                      # un-templated URLs: /users/81723 -&gt; /users/:id
    regex: "/users/[0-9]+"
    target_label: path
    replacement: "/users/:id"</pre>
<pre># vmagent stream aggregation: store the aggregate, not every pod
# -remoteWrite.streamAggr.config=/etc/vmagent/aggr.yml
- match: 'http_requests_total'
  interval: 1m
  without: [pod, instance]
  outputs: [total]</pre>
<pre># hard limits, so one bad deploy can't take storage down
vmagent   -remoteWrite.maxHourlySeries=2000000 -remoteWrite.maxDailySeries=5000000
vmstorage -storage.maxHourlySeries=10000000
vmselect  -search.maxUniqueTimeseries=300000           # per query</pre>`;

  /* ============================ Lesson 1 ============================ */

  I.lessons.push({
    id: "nestjs-in-depth",
    track: "architecture",
    order: 60,
    icon: "🐈",
    level: 2,
    minutes: 18,
    title: { en: "NestJS in Depth: Modules, DI and the Request Pipeline", he: "NestJS לעומק: modules, DI וה-request pipeline" },
    tldr: {
      en: "NestJS is an IoC container plus a fixed request pipeline on top of Express or Fastify. Modules draw the dependency boundaries, providers are singletons unless you pay for request scope, and every request flows middleware → guards → interceptors → pipes → handler → interceptors → filters. Know that order, and you know where every cross-cutting concern belongs.",
      he: "NestJS הוא IoC container עם request pipeline קבוע, מעל Express או Fastify. ה-modules מגדירים את גבולות התלויות, ה-providers הם singleton אלא אם אתה משלם על request scope, וכל בקשה עוברת middleware → guards → interceptors → pipes → handler → interceptors → filters. מי שמכיר את הסדר הזה יודע איפה לשים כל cross-cutting concern."
    },
    analogy: {
      en: "A NestJS app is an airport. Modules are terminals: each has its own staff, and only the gates it exports are reachable from outside. DI is the staffing agency that assigns one employee per role for the whole day (singleton), unless you ask for a personal escort per passenger (request scope), which is great service and very expensive. Every passenger walks the same fixed route: entrance (middleware), passport control (guard), the timer on the boarding clock (interceptor), baggage check (pipe), the plane (handler), and the complaints desk if anything went wrong (exception filter).",
      he: "אפליקציית NestJS היא שדה תעופה. ה-modules הם הטרמינלים: לכל אחד צוות משלו, ורק השערים שהוא מייצא נגישים מבחוץ. ה-DI הוא חברת כוח האדם שמציבה עובד אחד לכל תפקיד לכל היום (singleton), אלא אם ביקשת מלווה אישי לכל נוסע (request scope). זה שירות מצוין, ויקר מאוד. כל נוסע עובר את אותו מסלול קבוע: כניסה (middleware), ביקורת דרכונים (guard), השעון שמודד את זמן העלייה למטוס (interceptor), בדיקת מזוודות (pipe), המטוס (handler), ודלפק התלונות אם משהו השתבש (exception filter)."
    },
    sections: [
      {
        h: { en: "Modules: the real unit of encapsulation", he: "Modules: יחידת ה-encapsulation האמיתית" },
        body: {
          en: `<p>A module is a DI scope. Providers declared in a module are <strong>private</strong> to it unless listed in <code>exports</code>, and a consumer must <code>import</code> the module to see them. This is what lets a NestJS monolith stay modular: the compiler won't stop <code>billing</code> from importing an <code>ordering</code> repository file, but DI will refuse to inject it unless <code>OrderingModule</code> exported it.</p>
<ul>
<li><strong>Feature module</strong>: one per business capability (<code>OrdersModule</code>, <code>BillingModule</code>). Owns its controllers, services and repositories.</li>
<li><strong>Shared module</strong>: exports reusable providers (an HTTP client wrapper, a logger). Modules are singletons, so importing it in five places still gives one instance of each provider.</li>
<li><strong>Global module</strong> (<code>@Global()</code> or <code>global: true</code>): exported providers are injectable everywhere without importing. Fine for config, DB pool and logger; abused, it hides your dependency graph.</li>
<li><strong>Dynamic module</strong>: a static method returns a <code>DynamicModule</code> so the importer configures it. Convention: <code>forRoot</code> (configure once, app-wide), <code>forRootAsync</code> (config comes from another provider, usually <code>ConfigService</code>), <code>forFeature</code> (per-module slice, like <code>TypeOrmModule.forFeature([Order])</code>). For your own libraries, <code>ConfigurableModuleBuilder</code> generates the <code>forRoot</code>/<code>forRootAsync</code> boilerplate.</li>
</ul>
${C_MODULES}
<blockquote>⚠️ Production tip: a circular import between two modules (<code>forwardRef(() =&gt; OtherModule)</code>) is a design smell, not a syntax problem. It usually means a third concept wants to exist, or the two modules should talk through an event. Nest 11 also made module key generation much cheaper, so large graphs boot faster, but a 300-module graph with global everything is still hard to reason about.</blockquote>`,
          he: `<p>Module הוא scope של DI. Providers שמוגדרים ב-module הם <strong>פרטיים</strong> לו, אלא אם הם מופיעים ב-<code>exports</code>, ומי שרוצה להשתמש בהם חייב לעשות <code>import</code> ל-module. זה מה שמאפשר למונולית של NestJS להישאר מודולרי: ה-compiler לא ימנע מ-<code>billing</code> לייבא קובץ repository של <code>ordering</code>, אבל ה-DI יסרב להזריק אותו אם <code>OrderingModule</code> לא ייצא אותו.</p>
<ul>
<li><strong>Feature module</strong>: אחד לכל יכולת עסקית (<code>OrdersModule</code>, <code>BillingModule</code>). מחזיק את ה-controllers, ה-services וה-repositories שלו.</li>
<li><strong>Shared module</strong>: מייצא providers לשימוש חוזר (wrapper ל-HTTP client, logger). Modules הם singleton, אז גם אם תייבא אותו בחמישה מקומות תקבל instance אחד מכל provider.</li>
<li><strong>Global module</strong> (<code>@Global()</code> או <code>global: true</code>): ה-providers שהוא מייצא זמינים להזרקה בכל מקום בלי import. מתאים ל-config, ל-DB pool ול-logger. בשימוש מופרז הוא מסתיר את גרף התלויות.</li>
<li><strong>Dynamic module</strong>: מתודה סטטית מחזירה <code>DynamicModule</code>, כך שמי שמייבא קובע את הקונפיגורציה. המוסכמה: <code>forRoot</code> (קונפיגורציה אחת לכל האפליקציה), <code>forRootAsync</code> (הקונפיגורציה מגיעה מ-provider אחר, בדרך כלל <code>ConfigService</code>), <code>forFeature</code> (חלק לכל module, כמו <code>TypeOrmModule.forFeature([Order])</code>). בספריות שלך, <code>ConfigurableModuleBuilder</code> מייצר את ה-boilerplate של <code>forRoot</code> ו-<code>forRootAsync</code>.</li>
</ul>
${C_MODULES}
<blockquote>⚠️ Production tip: import מעגלי בין שני modules (<code>forwardRef(() =&gt; OtherModule)</code>) הוא ריח של בעיית תכנון, לא בעיית syntax. בדרך כלל זה אומר שמסתתר פה קונספט שלישי, או שה-modules צריכים לדבר דרך event. ב-Nest 11 יצירת ה-keys של ה-modules נהייתה הרבה יותר זולה, כך שגרפים גדולים עולים מהר יותר. אבל גרף של 300 modules שהכול בו global עדיין קשה להבנה.</blockquote>`
        }
      },
      {
        h: { en: "Providers, injection tokens and DI scopes", he: "Providers, injection tokens ו-scopes של DI" },
        body: {
          en: `<p>A provider is anything the container can create and inject. The <strong>token</strong> is the key; the recipe is one of four forms:</p>
<ul>
<li><code>useClass</code>: instantiate this class (the default when you list a class). Use it to swap implementations per environment.</li>
<li><code>useValue</code>: a ready object: constants, feature flags, mocks in tests.</li>
<li><code>useFactory</code> + <code>inject</code>: build it with other providers; may be <code>async</code>, and Nest awaits it before the app starts. This is how DB pools and SDK clients are born.</li>
<li><code>useExisting</code>: an alias to another token (same instance).</li>
</ul>
<p>Tokens can be a class, a string or a <code>Symbol</code>. An <strong>abstract class</strong> is the idiomatic choice for ports: TypeScript interfaces vanish at runtime, so they can't be tokens, while an abstract class is both the type and the token, with no <code>@Inject</code> needed.</p>
${C_PROVIDERS}
<p><strong>Scopes</strong>:</p>
<table>
<tr><th>Scope</th><th>Instances</th><th>Use for</th><th>Cost</th></tr>
<tr><td><code>DEFAULT</code> (singleton)</td><td>One per app, created at boot</td><td>Almost everything</td><td>None per request; must be stateless</td></tr>
<tr><td><code>REQUEST</code></td><td>One per incoming request</td><td>Per-request context (tenant, user) when you can't avoid it</td><td>Instantiation + GC on every request, and it <strong>bubbles up</strong></td></tr>
<tr><td><code>TRANSIENT</code></td><td>A new one for every consumer that injects it</td><td>Loggers with a per-class context</td><td>One instance per injection site, created at boot</td></tr>
</table>
<p>The bubbling is the trap: if <code>OrdersService</code> injects the request-scoped <code>TenantContext</code>, then <code>OrdersService</code> becomes request-scoped too, and so does the controller that injects it. One innocent injection turns a whole branch of the graph into "construct 15 objects per request". At thousands of RPS that shows up as extra GC pauses and higher p99. Better options: pass the tenant explicitly, read it from <code>AsyncLocalStorage</code> (the <code>nestjs-cls</code> package wraps this nicely), or use <strong>durable providers</strong> (a <code>ContextIdStrategy</code>) so instances are cached per tenant instead of per request.</p>
<blockquote>💡 Real world: a singleton that stores <code>this.currentUser = req.user</code> is a cross-tenant data leak waiting to happen. Under concurrency, request A reads the user set by request B. Singletons must hold no per-request state.</blockquote>`,
          he: `<p>Provider הוא כל דבר שה-container יודע ליצור ולהזריק. ה-<strong>token</strong> הוא המפתח, והמתכון הוא אחת מארבע צורות:</p>
<ul>
<li><code>useClass</code>: ליצור instance של המחלקה הזו (ברירת המחדל כשמציינים מחלקה). שימושי להחלפת מימוש לפי סביבה.</li>
<li><code>useValue</code>: אובייקט מוכן: קבועים, feature flags, mocks בטסטים.</li>
<li><code>useFactory</code> עם <code>inject</code>: בונים אותו בעזרת providers אחרים. יכול להיות <code>async</code>, ו-Nest מחכה לו לפני שהאפליקציה עולה. ככה נולדים DB pools ו-clients של SDK.</li>
<li><code>useExisting</code>: alias ל-token אחר (אותו instance).</li>
</ul>
<p>Token יכול להיות מחלקה, string או <code>Symbol</code>. <strong>Abstract class</strong> היא הבחירה האידיומטית ל-ports: interfaces של TypeScript נעלמים בזמן ריצה ולכן לא יכולים להיות tokens, ואילו abstract class היא גם הטיפוס וגם ה-token, בלי צורך ב-<code>@Inject</code>.</p>
${C_PROVIDERS}
<p><strong>Scopes</strong>:</p>
<table>
<tr><th>Scope</th><th>Instances</th><th>מתי</th><th>מחיר</th></tr>
<tr><td><code>DEFAULT</code> (singleton)</td><td>אחד לאפליקציה, נוצר ב-boot</td><td>כמעט תמיד</td><td>אפס לכל בקשה; חייב להיות stateless</td></tr>
<tr><td><code>REQUEST</code></td><td>אחד לכל בקשה נכנסת</td><td>Context לכל בקשה (tenant, user) כשאין ברירה</td><td>יצירה ו-GC בכל בקשה, והוא <strong>מבעבע למעלה</strong></td></tr>
<tr><td><code>TRANSIENT</code></td><td>חדש לכל צרכן שמזריק אותו</td><td>Loggers עם context לכל מחלקה</td><td>Instance לכל נקודת הזרקה, נוצר ב-boot</td></tr>
</table>
<p>הבעבוע הוא המלכודת: אם <code>OrdersService</code> מזריק את <code>TenantContext</code> שהוא request-scoped, אז גם <code>OrdersService</code> נהיה request-scoped, וגם ה-controller שמזריק אותו. הזרקה תמימה אחת הופכת ענף שלם בגרף ל"תבנה 15 אובייקטים בכל בקשה". באלפי RPS זה מופיע כעוד GC pauses ו-p99 גבוה יותר. אפשרויות טובות יותר: להעביר את ה-tenant במפורש, לקרוא אותו מ-<code>AsyncLocalStorage</code> (החבילה <code>nestjs-cls</code> עוטפת את זה יפה), או להשתמש ב-<strong>durable providers</strong> (עם <code>ContextIdStrategy</code>) כך שה-instances נשמרים לכל tenant ולא לכל בקשה.</p>
<blockquote>💡 Real world: singleton ששומר <code>this.currentUser = req.user</code> הוא דליפת מידע בין tenants שמחכה לקרות. תחת concurrency, בקשה A קוראת את ה-user שבקשה B שמרה. ל-singleton אסור להחזיק state של בקשה.</blockquote>`
        }
      },
      {
        h: { en: "The request pipeline: guards, interceptors, pipes, filters", he: "ה-request pipeline: guards, interceptors, pipes ו-filters" },
        body: {
          en: `${C_PIPELINE}
<p><strong>Guard</strong>: answers one question, "may this request proceed?". It has the <code>ExecutionContext</code>, so unlike middleware it knows which handler will run and can read its metadata (<code>@Public()</code>, <code>@Roles('admin')</code>). Return <code>false</code> for a 403 or throw for a specific status.</p>
${C_GUARD}
<p><strong>Interceptor</strong>: wraps the handler as an RxJS stream, so it sees both before and after. Logging, timing, response mapping, caching, timeouts and tracing spans live here.</p>
${C_INTERCEPTOR}
<p><strong>Pipe</strong>: validates and transforms arguments right before the handler. The global <code>ValidationPipe</code> plus <code>class-validator</code> DTOs is the standard:</p>
${C_PIPE}
<p><strong>Exception filter</strong>: turns any thrown error into a response. Built-in <code>HttpException</code>s already map to statuses; filters are for your domain errors and for a uniform error body.</p>
${C_FILTER}
<blockquote>⚠️ Production tip: guards run <em>before</em> pipes, so a guard sees the raw, unvalidated body. Never authorize based on <code>req.body</code> fields in a guard; authorize on the token and route params, then validate.</blockquote>`,
          he: `${C_PIPELINE}
<p><strong>Guard</strong>: עונה על שאלה אחת: "מותר לבקשה הזו להמשיך?". יש לו <code>ExecutionContext</code>, ולכן בניגוד ל-middleware הוא יודע איזה handler ירוץ ויכול לקרוא את ה-metadata שלו (<code>@Public()</code>, <code>@Roles('admin')</code>). מחזירים <code>false</code> בשביל 403, או זורקים exception בשביל status ספציפי.</p>
${C_GUARD}
<p><strong>Interceptor</strong>: עוטף את ה-handler כ-stream של RxJS, ולכן רואה גם את ה"לפני" וגם את ה"אחרי". Logging, מדידת זמנים, מיפוי תשובות, caching, timeouts ו-spans של tracing יושבים כאן.</p>
${C_INTERCEPTOR}
<p><strong>Pipe</strong>: מוודא ומתרגם ארגומנטים רגע לפני ה-handler. הסטנדרט הוא <code>ValidationPipe</code> גלובלי עם DTOs של <code>class-validator</code>:</p>
${C_PIPE}
<p><strong>Exception filter</strong>: הופך כל שגיאה שנזרקה לתשובה. ה-<code>HttpException</code>-ים המובנים כבר ממופים ל-statuses. Filters נועדו לשגיאות הדומיין שלך ולגוף שגיאה אחיד.</p>
${C_FILTER}
<blockquote>⚠️ Production tip: guards רצים <em>לפני</em> pipes, ולכן guard רואה את ה-body הגולמי, לפני validation. לעולם אל תעשה authorization ב-guard לפי שדות של <code>req.body</code>. תעשה authorization לפי ה-token וה-route params, ורק אחר כך validation.</blockquote>`
        }
      },
      {
        h: { en: "Config, health checks and graceful shutdown on Kubernetes", he: "Config, health checks ו-graceful shutdown ב-Kubernetes" },
        body: {
          en: `<p>Three things decide whether a Nest service behaves during a rollout:</p>
<ul>
<li><strong><code>@nestjs/config</code></strong>: loads <code>.env</code> and env vars, validates them at boot (Joi schema or a <code>validate</code> function with zod/class-validator), and serves typed values. Use <code>getOrThrow</code> for required keys and <code>registerAs('db', ...)</code> namespaces for grouping.</li>
<li><strong><code>@nestjs/terminus</code></strong>: health indicators for DB, HTTP, memory, disk and Redis/microservices. Split <strong>liveness</strong> (the process works; never depends on the DB, or a DB blip restarts your whole fleet) from <strong>readiness</strong> (can serve traffic now: DB reachable, warm-up done).</li>
<li><strong><code>enableShutdownHooks()</code></strong>: off by default because each hook adds process listeners. Without it, SIGTERM kills Node without running <code>onModuleDestroy</code>/<code>onApplicationShutdown</code>, so Kafka producers aren't flushed and DB pools aren't closed.</li>
</ul>
${C_OPS}
<p>The shutdown timeline: kubelet sends SIGTERM after <code>preStop</code> finishes; meanwhile the endpoint controller removes the Pod from Services. The 5 s <code>preStop</code> sleep plus Terminus' <code>gracefulShutdownTimeoutMs</code> cover the window where kube-proxy or the ingress still routes new requests to you. Everything must finish within <code>terminationGracePeriodSeconds</code>, or SIGKILL ends it.</p>
<blockquote>💡 Real world: NestJS 11 runs on Express 5 by default (and needs Node 20+). Express 5 changed wildcard routes: a bare <code>*</code> must now be named, like <code>*splat</code>. It is the most common upgrade break, together with middleware registered on <code>'*'</code> paths.</blockquote>`,
          he: `<p>שלושה דברים קובעים אם service של Nest מתנהג יפה בזמן rollout:</p>
<ul>
<li><strong><code>@nestjs/config</code></strong>: טוען <code>.env</code> ומשתני סביבה, מוודא אותם ב-boot (סכמת Joi, או פונקציית <code>validate</code> עם zod או class-validator), ומגיש ערכים עם טיפוסים. השתמש ב-<code>getOrThrow</code> למפתחות חובה, וב-namespaces של <code>registerAs('db', ...)</code> כדי לקבץ.</li>
<li><strong><code>@nestjs/terminus</code></strong>: health indicators ל-DB, HTTP, זיכרון, דיסק, Redis ו-microservices. תפריד בין <strong>liveness</strong> (התהליך עובד; לעולם לא תלוי ב-DB, אחרת תקלה רגעית ב-DB מפעילה מחדש את כל ה-fleet) לבין <strong>readiness</strong> (יכול לקבל traffic עכשיו: ה-DB זמין וה-warm-up הסתיים).</li>
<li><strong><code>enableShutdownHooks()</code></strong>: כבוי כברירת מחדל, כי כל hook מוסיף listeners לתהליך. בלעדיו, SIGTERM הורג את Node בלי להריץ <code>onModuleDestroy</code> או <code>onApplicationShutdown</code>. כלומר producers של Kafka לא עושים flush ו-DB pools לא נסגרים.</li>
</ul>
${C_OPS}
<p>ציר הזמן של כיבוי: ה-kubelet שולח SIGTERM אחרי שה-<code>preStop</code> מסתיים, ובמקביל ה-endpoint controller מוציא את ה-Pod מה-Services. ה-sleep של 5 שניות ב-<code>preStop</code>, יחד עם <code>gracefulShutdownTimeoutMs</code> של Terminus, מכסים את החלון שבו kube-proxy או ה-ingress עדיין שולחים אליך בקשות חדשות. הכול חייב להסתיים בתוך <code>terminationGracePeriodSeconds</code>, אחרת SIGKILL גומר את הסיפור.</p>
<blockquote>💡 Real world: NestJS 11 רץ כברירת מחדל על Express 5 (ודורש Node 20 ומעלה). ב-Express 5 השתנו ה-wildcard routes: כוכבית בודדת חייבת עכשיו שם, למשל <code>*splat</code>. זו השבירה הכי נפוצה בשדרוג, יחד עם middleware שנרשם על נתיבי <code>'*'</code>.</blockquote>`
        }
      },
      {
        h: { en: "Testing with Test.createTestingModule", he: "טסטים עם Test.createTestingModule" },
        body: {
          en: `<p>The testing module is the same DI container, compiled from whatever providers you hand it. Two levels cover most needs:</p>
<ul>
<li><strong>Unit</strong>: the class under test plus <code>useValue</code> fakes for its ports. Fast, no I/O. If a service needs eight mocks to test, the service has too many responsibilities.</li>
<li><strong>Integration / e2e</strong>: import the real <code>AppModule</code>, override only the edges you don't own (payment provider, email), and hit it with <code>supertest</code>. Pair it with a real Postgres in Testcontainers rather than mocking the repository; that's where the SQL bugs live.</li>
</ul>
${C_TEST}
<blockquote>⚠️ Production tip: <code>createNestApplication()</code> does not run your <code>main.ts</code>. Global pipes, filters, prefixes, versioning and CORS configured there are missing in e2e tests unless you apply them again. Put that setup in a shared <code>configureApp(app)</code> function called from both places.</blockquote>`,
          he: `<p>ה-testing module הוא אותו DI container, שמקומפל מה-providers שנתת לו. שתי רמות מכסות את רוב הצרכים:</p>
<ul>
<li><strong>Unit</strong>: המחלקה שנבדקת ועוד fakes של <code>useValue</code> ל-ports שלה. מהיר, בלי I/O. אם service צריך שמונה mocks כדי להיבדק, יש לו יותר מדי אחריות.</li>
<li><strong>Integration / e2e</strong>: מייבאים את ה-<code>AppModule</code> האמיתי, דורסים רק את הקצוות שלא שייכים לך (ספק תשלומים, מייל), ופונים אליו עם <code>supertest</code>. כדאי לחבר Postgres אמיתי ב-Testcontainers במקום לעשות mock ל-repository, כי שם גרים באגי ה-SQL.</li>
</ul>
${C_TEST}
<blockquote>⚠️ Production tip: <code>createNestApplication()</code> לא מריץ את ה-<code>main.ts</code> שלך. Global pipes, filters, prefixes, versioning ו-CORS שהוגדרו שם חסרים בטסטי e2e, אלא אם תחיל אותם שוב. תשים את ההגדרות האלה בפונקציה משותפת <code>configureApp(app)</code> ותקרא לה משני המקומות.</blockquote>`
        }
      }
    ],
    diagram: "HTTP request\n   |\n middleware (helmet, request-id)\n   |\n guards (global -> controller -> route)      401/403?\n   |\n interceptors BEFORE (timer, span, cache)\n   |\n pipes (ValidationPipe, ParseUUIDPipe)       400?\n   |\n controller handler  --->  service (singleton)  --->  repository / PG_POOL\n   |\n interceptors AFTER (map, timeout, log)\n   |\n exception filters (route -> controller -> global)\n   |\nHTTP response",
    handsOn: [
      { cmd: "npx @nestjs/cli@11 new orders-svc --strict --package-manager npm && cd orders-svc && npx nest g resource orders", what: { en: "Scaffold a strict-mode Nest 11 app and generate a feature module with controller, service and DTOs.", he: "ליצור אפליקציית Nest 11 ב-strict mode ולג'נרט feature module עם controller, service ו-DTOs." } },
      { cmd: "npm i @nestjs/config @nestjs/terminus @nestjs/jwt class-validator class-transformer joi", what: { en: "Install config validation, health checks, JWT and DTO validation.", he: "להתקין validation ל-config, health checks, JWT ו-validation ל-DTOs." } },
      { cmd: "curl -i -X POST localhost:3000/orders -H 'content-type: application/json' -d '{\"customerId\":\"x\",\"lines\":[],\"isAdmin\":true}'", what: { en: "With whitelist + forbidNonWhitelisted you should get a 400 listing three problems: bad UUID, empty lines, unknown isAdmin.", he: "עם whitelist ו-forbidNonWhitelisted אתה אמור לקבל 400 עם שלוש בעיות: UUID לא תקין, lines ריק, ושדה isAdmin לא מוכר." } },
      { cmd: "kubectl rollout restart deploy/orders && kubectl logs -f -l app=orders --prefix --max-log-requests 10", what: { en: "Watch shutdown hooks fire during a rollout: you want to see onApplicationShutdown logs and zero 5xx at the ingress.", he: "לראות את ה-shutdown hooks רצים בזמן rollout: אתה רוצה לראות לוגים של onApplicationShutdown ואפס 5xx ב-ingress." } },
      { cmd: "npx jest --runInBand --coverage test/orders.e2e-spec.ts", what: { en: "Run the e2e suite serially (shared DB container) and check that pipes and filters really apply.", he: "להריץ את טסטי ה-e2e ברצף (DB container משותף) ולוודא שה-pipes וה-filters באמת מופעלים." } }
    ],
    mnemonic: { en: "\"My Good Intern Pipes Hot Iced Fudge\": Middleware, Guards, Interceptors, Pipes, Handler, Interceptors, Filters.", he: "\"מי גונב את הפסטה החמה, אני פותר\": Middleware, Guards, Interceptors, Pipes, Handler, Interceptors, Filters. ובקיצור: שומר לפני מסננת." },
    pitfalls: [
      { en: "Injecting a REQUEST-scoped provider deep in the graph: scope bubbles up to every consumer and the controller, silently turning singletons into per-request allocations and raising p99. Use AsyncLocalStorage (nestjs-cls) or durable providers.", he: "הזרקה של provider עם REQUEST scope עמוק בגרף: ה-scope מבעבע לכל מי שצורך אותו ועד ה-controller, הופך בשקט singletons להקצאות בכל בקשה ומעלה את ה-p99. השתמש ב-AsyncLocalStorage (nestjs-cls) או ב-durable providers." },
      { en: "Nested DTOs without @ValidateNested + @Type: the outer object validates, the array of lines is never checked, and garbage reaches the database.", he: "DTOs מקוננים בלי @ValidateNested ו-@Type: האובייקט החיצוני עובר validation, מערך ה-lines לא נבדק בכלל, וזבל מגיע ל-DB." },
      { en: "No enableShutdownHooks() and 'npm start' as the container command: SIGTERM never reaches Nest cleanly, in-flight requests get 502s and Kafka producers lose buffered messages on every deploy.", he: "בלי enableShutdownHooks() ועם 'npm start' כפקודת ה-container: SIGTERM לא מגיע ל-Nest כמו שצריך, בקשות באמצע מקבלות 502, ו-producers של Kafka מאבדים הודעות שב-buffer בכל deploy." },
      { en: "Treating the RxJS timeout() in an interceptor as cancellation: the client gets 408, but the DB query and downstream HTTP call keep running. Pass an AbortSignal or set statement_timeout on the DB too.", he: "לחשוב ש-timeout() של RxJS ב-interceptor מבטל את העבודה: ה-client מקבל 408, אבל ה-query ב-DB והקריאה ל-HTTP downstream ממשיכים לרוץ. תעביר AbortSignal, או תגדיר גם statement_timeout ב-DB." }
    ],
    interview: [
      {
        q: { en: "Walk me through what happens between an HTTP request arriving and your controller method running in NestJS. Where would you put auth, request logging and input validation?", he: "תסביר מה קורה ב-NestJS מהרגע שבקשת HTTP מגיעה ועד שמתודת ה-controller רצה. איפה תשים auth, request logging ו-validation של קלט?" },
        a: { en: "Middleware first (Express-level: request id, helmet), then guards (authn/authz: they have the ExecutionContext so they can read @Public/@Roles metadata), then interceptors' before-phase (start timer, open span), then pipes (ValidationPipe turns JSON into a validated DTO), then the handler, then interceptors' after-phase (log latency, map response, timeout), and exception filters catch anything thrown on the way. So: auth in a global guard registered via APP_GUARD, logging and timing in an interceptor (it sees both sides and the route), validation in a global ValidationPipe with whitelist. I'd add that guards see the unvalidated body, so authorization never trusts body fields.", he: "קודם middleware (ברמת Express: request id, helmet), אחר כך guards (authn ו-authz: יש להם ExecutionContext ולכן הם קוראים metadata כמו @Public או @Roles), אחר כך שלב ה-before של ה-interceptors (מתחילים טיימר, פותחים span), אחר כך pipes (ה-ValidationPipe הופך JSON ל-DTO מאומת), ה-handler, שלב ה-after של ה-interceptors (latency ללוג, מיפוי תשובה, timeout), ו-exception filters תופסים כל דבר שנזרק בדרך. לכן: auth ב-guard גלובלי שנרשם דרך APP_GUARD, logging ומדידת זמנים ב-interceptor (הוא רואה את שני הצדדים ואת ה-route), ו-validation ב-ValidationPipe גלובלי עם whitelist. הייתי מוסיף ש-guards רואים body שעוד לא עבר validation, ולכן authorization אף פעם לא סומך על שדות ב-body." }
      },
      {
        q: { en: "A teammate made a TenantContext provider REQUEST-scoped and latency went up across the service. Why, and what would you do instead?", he: "חבר צוות הפך provider של TenantContext ל-REQUEST scope, וה-latency עלה בכל ה-service. למה, ומה היית עושה במקום?" },
        a: { en: "Request scope propagates up the injection chain: every provider and controller that depends on TenantContext, directly or transitively, is now built per request. That's many allocations per request, more GC, and no more boot-time caching of those instances. Options: carry the tenant in AsyncLocalStorage set by a middleware (nestjs-cls), so singletons read it without being re-created; pass tenantId explicitly as a method argument; or, if instances genuinely differ per tenant (a DB connection per tenant), use durable providers with a ContextIdStrategy so the subtree is cached per tenant, not per request. I'd confirm with a load test before and after, looking at p99 and GC pause time.", he: "Request scope מתפשט למעלה בשרשרת ההזרקה: כל provider ו-controller שתלוי ב-TenantContext, ישירות או בעקיפין, נבנה עכשיו בכל בקשה. זה הרבה הקצאות בכל בקשה, יותר GC, ובלי caching של ה-instances מזמן ה-boot. אפשרויות: להחזיק את ה-tenant ב-AsyncLocalStorage שמוגדר ב-middleware (nestjs-cls), כך ש-singletons קוראים אותו בלי להיבנות מחדש; להעביר tenantId במפורש כארגומנט; או, אם ה-instances באמת שונים לכל tenant (חיבור DB לכל tenant), להשתמש ב-durable providers עם ContextIdStrategy כך שתת-העץ נשמר לכל tenant ולא לכל בקשה. הייתי מאמת עם load test לפני ואחרי, ומסתכל על p99 ועל זמני GC pause." }
      },
      {
        q: { en: "How do you make a NestJS service shut down without dropping requests during a Kubernetes rolling update?", he: "איך גורמים ל-service של NestJS לכבות בלי לאבד בקשות בזמן rolling update ב-Kubernetes?" },
        a: { en: "Run node directly as PID 1 (exec-form CMD, not npm start) so it receives SIGTERM. Call app.enableShutdownHooks() so Nest runs onModuleDestroy, beforeApplicationShutdown, closes the HTTP server (finishing in-flight requests), then onApplicationShutdown where I flush producers and close pools. Add a preStop sleep of about 5 s (or Terminus gracefulShutdownTimeoutMs) because endpoint removal is asynchronous and the LB may still send new requests after SIGTERM. Keep readiness separate from liveness, set terminationGracePeriodSeconds above preStop plus the longest request, and align HTTP keep-alive timeouts with the load balancer so idle connections aren't reused after close.", he: "להריץ את node ישירות כ-PID 1 (CMD בצורת exec, לא npm start) כדי שיקבל SIGTERM. לקרוא ל-app.enableShutdownHooks() כדי ש-Nest יריץ onModuleDestroy ו-beforeApplicationShutdown, יסגור את שרת ה-HTTP (בקשות באמצע מסתיימות), ואז onApplicationShutdown, שם אני עושה flush ל-producers וסוגר pools. להוסיף preStop sleep של בערך 5 שניות (או gracefulShutdownTimeoutMs של Terminus), כי הוצאת ה-endpoint היא אסינכרונית וה-LB עלול לשלוח בקשות חדשות גם אחרי SIGTERM. להפריד readiness מ-liveness, לקבוע terminationGracePeriodSeconds גבוה מה-preStop ועוד הבקשה הכי ארוכה, וליישר את ה-keep-alive timeouts של HTTP מול ה-load balancer כדי שחיבורים idle לא ימוחזרו אחרי הסגירה." }
      }
    ],
    quiz: [
      {
        q: { en: "In what order do these run for one request?", he: "באיזה סדר הם רצים בבקשה אחת?" },
        options: [
          { en: "Pipes → guards → interceptors → handler", he: "Pipes → guards → interceptors → handler" },
          { en: "Guards → interceptors (before) → pipes → handler", he: "Guards → interceptors (before) → pipes → handler" },
          { en: "Interceptors → guards → pipes → handler", he: "Interceptors → guards → pipes → handler" },
          { en: "Guards → pipes → interceptors (before) → handler", he: "Guards → pipes → interceptors (before) → handler" }
        ],
        answer: 1,
        explain: { en: "Middleware, then guards, then interceptors' before-phase, then pipes, then the handler. Exception filters handle anything thrown along the way.", he: "Middleware, אחר כך guards, אחר כך שלב ה-before של ה-interceptors, אחר כך pipes ואז ה-handler. Exception filters מטפלים בכל מה שנזרק בדרך." }
      },
      {
        q: { en: "OrdersService (default scope) injects TenantContext (Scope.REQUEST). What is OrdersService's effective scope?", he: "OrdersService (scope רגיל) מזריק את TenantContext (Scope.REQUEST). מה ה-scope האפקטיבי של OrdersService?" },
        options: [
          { en: "Singleton; only TenantContext is per request", he: "Singleton; רק TenantContext נוצר בכל בקשה" },
          { en: "Transient", he: "Transient" },
          { en: "Request-scoped, and so is anything that injects OrdersService", he: "Request-scoped, וגם כל מי שמזריק את OrdersService" },
          { en: "Nest throws at boot", he: "Nest זורק שגיאה ב-boot" }
        ],
        answer: 2,
        explain: { en: "Request scope bubbles up the injection chain: consumers of a request-scoped provider become request-scoped too, up to the controller.", he: "Request scope מבעבע למעלה בשרשרת ההזרקה: מי שצורך provider שהוא request-scoped נהיה request-scoped בעצמו, עד ה-controller." }
      },
      {
        q: { en: "Why use an abstract class instead of a TypeScript interface as a port like OrderRepository?", he: "למה להשתמש ב-abstract class ולא ב-interface של TypeScript עבור port כמו OrderRepository?" },
        options: [
          { en: "Interfaces are slower at runtime", he: "Interfaces איטיים יותר בזמן ריצה" },
          { en: "Interfaces don't exist at runtime, so they can't be DI tokens; an abstract class is both the type and the token", he: "Interfaces לא קיימים בזמן ריצה ולכן לא יכולים להיות DI tokens; abstract class היא גם הטיפוס וגם ה-token" },
          { en: "Nest forbids interfaces in constructors", he: "Nest אוסר interfaces ב-constructors" },
          { en: "Abstract classes are automatically global", he: "Abstract classes הן global אוטומטית" }
        ],
        answer: 1,
        explain: { en: "TypeScript erases interfaces. With an interface you'd need a string/Symbol token plus @Inject; an abstract class works as the token directly.", he: "TypeScript מוחק interfaces בקומפילציה. עם interface תצטרך token מסוג string או Symbol ועוד @Inject; abstract class עובדת ישירות כ-token." }
      },
      {
        q: { en: "Your e2e test posts an invalid body but gets 201 instead of 400. The app returns 400 in production. Most likely cause?", he: "טסט e2e שולח body לא תקין ומקבל 201 במקום 400. בפרודקשן האפליקציה מחזירה 400. מה הסיבה הסבירה?" },
        options: [
          { en: "class-validator doesn't work under Jest", he: "class-validator לא עובד תחת Jest" },
          { en: "The ValidationPipe is registered in main.ts, which createNestApplication() doesn't run", he: "ה-ValidationPipe נרשם ב-main.ts, ו-createNestApplication() לא מריץ אותו" },
          { en: "supertest strips the body", he: "supertest מוחק את ה-body" },
          { en: "Guards ran after pipes", he: "Guards רצו אחרי pipes" }
        ],
        answer: 1,
        explain: { en: "app.useGlobalPipes in main.ts isn't part of the module graph. Register it with APP_PIPE in a module, or call a shared configureApp(app) in tests too.", he: "app.useGlobalPipes ב-main.ts הוא לא חלק מגרף ה-modules. תרשום אותו עם APP_PIPE בתוך module, או תקרא לפונקציה משותפת configureApp(app) גם בטסטים." }
      }
    ],
    related: ["node-web-frameworks", "nestjs-ddd-event-driven", "k8s-probes", "pr-solid", "pr-design-patterns", "pr-singletons", "pr-input-validation", "pr-error-handling", "pr-unit-testing-craft"]
  });

  /* ============================ Lesson 2 ============================ */

  I.lessons.push({
    id: "nestjs-ddd-event-driven",
    track: "architecture",
    order: 61,
    icon: "🧭",
    level: 3,
    minutes: 20,
    title: { en: "NestJS + DDD + Event-Driven: Structuring a Real Service", he: "NestJS עם DDD ו-event-driven: איך בונים service אמיתי" },
    tldr: {
      en: "Map each bounded context to a Nest module with domain/application/infrastructure/interface folders, let aggregates record domain events, write them to an outbox in the same transaction, relay them to Kafka/RabbitMQ/SQS, and make every consumer idempotent with a dedup table. @nestjs/cqrs gives you the buses, but its EventBus is in-memory: durability comes from the outbox, not from the framework.",
      he: "ממפים כל bounded context ל-module של Nest עם תיקיות domain, application, infrastructure ו-interface. ה-aggregates רושמים domain events, כותבים אותם ל-outbox באותה טרנזקציה, relay מעביר אותם ל-Kafka, RabbitMQ או SQS, וכל consumer הוא idempotent בעזרת טבלת dedup. @nestjs/cqrs נותן לך את ה-buses, אבל ה-EventBus שלו הוא in-memory: העמידות מגיעה מה-outbox, לא מה-framework."
    },
    analogy: {
      en: "Think of a bank branch. Each department (bounded context) has its own ledger and its own staff, and they never write in each other's books. When a teller (aggregate) approves a loan, the decision and an outgoing memo are written in the same ledger entry (outbox, one transaction). A courier (relay) collects unsent memos every few minutes and delivers them, sometimes twice if he isn't sure the first one arrived. So each receiving department keeps a log of memo numbers it already handled (idempotent consumer) and ignores repeats.",
      he: "תחשוב על סניף בנק. לכל מחלקה (bounded context) יש ספר חשבונות וצוות משלה, ואף אחת לא כותבת בספרים של השנייה. כשפקיד (aggregate) מאשר הלוואה, ההחלטה ומזכר יוצא נכתבים באותה רשומה בספר (outbox, טרנזקציה אחת). שליח (relay) אוסף כל כמה דקות מזכרים שלא נשלחו ומחלק אותם, ולפעמים פעמיים, כשהוא לא בטוח שהראשון הגיע. לכן כל מחלקה שמקבלת מזכרים מחזיקה רשימה של מספרי מזכרים שכבר טיפלה בהם (idempotent consumer) ומתעלמת מכפילויות."
    },
    sections: [
      {
        h: { en: "Bounded contexts as modules, hexagonal folders inside", he: "Bounded contexts בתור modules, ותיקיות hexagonal בפנים" },
        body: {
          en: `<p>The theory of bounded contexts and aggregates is in <code>pr-ddd</code>; here is how it lands in a NestJS codebase. One bounded context = one Nest module (and one schema or set of tables it alone writes). Inside, four layers with a strict dependency rule: <strong>everything points inward to domain</strong>.</p>
<table>
<tr><th>Layer</th><th>Contains</th><th>May import</th></tr>
<tr><td><code>domain/</code></td><td>Aggregates, value objects, domain events, ports (abstract classes)</td><td>Nothing framework-specific (a pragmatic exception: <code>AggregateRoot</code> from <code>@nestjs/cqrs</code>)</td></tr>
<tr><td><code>application/</code></td><td>Command/query handlers, sagas, use-case orchestration, transactions</td><td>domain</td></tr>
<tr><td><code>infrastructure/</code></td><td>Repository implementations, broker publishers, external API clients</td><td>domain, application, ORM/SDKs</td></tr>
<tr><td><code>interface/</code></td><td>HTTP controllers + DTOs, message consumers, gRPC handlers</td><td>application (sends commands/queries)</td></tr>
</table>
${C_TREE}
<p>The module file wires ports to adapters: <code>{ provide: OrderRepository, useClass: PgOrderRepository }</code>. Other contexts get either an exported application-level facade or, better, nothing at all: they react to <strong>integration events</strong>. Keep domain events (internal, rich, can change freely) separate from integration events (public, versioned like <code>ordering.order-placed.v1</code>, backward compatible); a mapper in infrastructure translates one into the other.</p>
<blockquote>⚠️ Production tip: enforce the layering in CI, not in code review. <code>dependency-cruiser</code> or ESLint <code>no-restricted-imports</code> rules like "<code>billing/**</code> may not import <code>ordering/(domain|infrastructure)/**</code>" catch the leak the day it's written. A modular monolith built this way can later split a context into its own service with almost no code change.</blockquote>`,
          he: `<p>התיאוריה של bounded contexts ו-aggregates נמצאת ב-<code>pr-ddd</code>. כאן רואים איך היא נוחתת בקוד של NestJS. Bounded context אחד = module אחד של Nest (ו-schema או סט טבלאות שרק הוא כותב אליהם). בפנים יש ארבע שכבות עם חוק תלויות נוקשה: <strong>הכול מצביע פנימה, אל ה-domain</strong>.</p>
<table>
<tr><th>שכבה</th><th>מה יש בה</th><th>מה מותר לה לייבא</th></tr>
<tr><td><code>domain/</code></td><td>Aggregates, value objects, domain events, ports (abstract classes)</td><td>שום דבר שקשור ל-framework (חריגה פרגמטית: <code>AggregateRoot</code> מ-<code>@nestjs/cqrs</code>)</td></tr>
<tr><td><code>application/</code></td><td>Command handlers ו-query handlers, sagas, תזמור של use cases, טרנזקציות</td><td>domain</td></tr>
<tr><td><code>infrastructure/</code></td><td>מימושים של repositories, publishers ל-broker, clients ל-APIs חיצוניים</td><td>domain, application, ORM ו-SDKs</td></tr>
<tr><td><code>interface/</code></td><td>Controllers של HTTP עם DTOs, consumers של הודעות, handlers של gRPC</td><td>application (שולח commands ו-queries)</td></tr>
</table>
${C_TREE}
<p>קובץ ה-module מחבר ports ל-adapters: <code>{ provide: OrderRepository, useClass: PgOrderRepository }</code>. Contexts אחרים מקבלים facade מיוצא ברמת ה-application, או עדיף, כלום: הם מגיבים ל-<strong>integration events</strong>. תפריד בין domain events (פנימיים, עשירים, מותר לשנות אותם) לבין integration events (ציבוריים, עם גרסה כמו <code>ordering.order-placed.v1</code>, ותואמים לאחור). Mapper בשכבת ה-infrastructure מתרגם מאחד לשני.</p>
<blockquote>⚠️ Production tip: תאכוף את השכבות ב-CI, לא ב-code review. כללים של <code>dependency-cruiser</code> או <code>no-restricted-imports</code> של ESLint, כמו "<code>billing/**</code> לא מייבא את <code>ordering/(domain|infrastructure)/**</code>", תופסים את הדליפה ביום שבו היא נכתבת. Modular monolith שבנוי ככה יכול בהמשך להוציא context ל-service נפרד כמעט בלי לשנות קוד.</blockquote>`
        }
      },
      {
        h: { en: "Aggregates, domain events and CQRS with @nestjs/cqrs", he: "Aggregates, domain events ו-CQRS עם @nestjs/cqrs" },
        body: {
          en: `<p>The aggregate enforces invariants and <em>records</em> what happened. <code>apply()</code> stores the event in the aggregate's uncommitted list; nothing is published yet.</p>
${C_AGG}
<p><code>@nestjs/cqrs</code> provides <code>CommandBus</code>, <code>QueryBus</code>, <code>EventBus</code> and <code>@Saga()</code>. Commands change state through the aggregate; queries read from a denormalized view and never load aggregates.</p>
${C_CQRS}
<p>The critical detail: Nest's <code>EventBus</code> and sagas are <strong>in-process RxJS subjects</strong>. If the Pod dies between the DB commit and the event handler, the event is gone; if you publish to it <em>before</em> commit and the transaction rolls back, you announced something that never happened. The usual Nest examples call <code>publisher.mergeObjectContext(order)</code> and <code>order.commit()</code>, which publishes in-memory right away. That's fine for side effects inside the same context that can be lost or re-derived (cache warm-up, local projections). Anything another context depends on goes through the outbox.</p>
<blockquote>💡 Real world: you don't need CQRS everywhere. Use the command/query split where reads and writes really differ in shape or scale (an order write model with invariants vs a search/listing view). For a CRUD settings page, a plain service is the honest design.</blockquote>`,
          he: `<p>ה-aggregate אוכף invariants ו<em>רושם</em> מה קרה. <code>apply()</code> שומר את ה-event ברשימת ה-uncommitted של ה-aggregate, ועדיין שום דבר לא מתפרסם.</p>
${C_AGG}
<p><code>@nestjs/cqrs</code> נותן <code>CommandBus</code>, <code>QueryBus</code>, <code>EventBus</code> ו-<code>@Saga()</code>. Commands משנים state דרך ה-aggregate. Queries קוראים מ-view דה-נורמלי ואף פעם לא טוענים aggregates.</p>
${C_CQRS}
<p>הפרט הקריטי: ה-<code>EventBus</code> וה-sagas של Nest הם <strong>subjects של RxJS בתוך התהליך</strong>. אם ה-Pod מת בין ה-commit ב-DB לבין ה-event handler, ה-event אבד. אם מפרסמים אליו <em>לפני</em> ה-commit והטרנזקציה נכשלת, הודעת על משהו שלא קרה. הדוגמאות הרגילות של Nest קוראות ל-<code>publisher.mergeObjectContext(order)</code> ול-<code>order.commit()</code>, וזה מפרסם in-memory מיד. זה בסדר ל-side effects בתוך אותו context שמותר לאבד או לחשב מחדש (חימום cache, projections מקומיות). כל דבר ש-context אחר תלוי בו עובר דרך ה-outbox.</p>
<blockquote>💡 Real world: לא צריך CQRS בכל מקום. תפריד commands מ-queries איפה שקריאה וכתיבה באמת שונות בצורה או ב-scale (מודל כתיבה של הזמנה עם invariants, מול view של חיפוש ורשימות). בדף הגדרות שהוא CRUD פשוט, service רגיל הוא התכנון הכנה.</blockquote>`
        }
      },
      {
        h: { en: "Transactional outbox: table, relay and its failure modes", he: "Transactional outbox: טבלה, relay ומצבי כשל" },
        body: {
          en: `<p>Why the outbox exists (the dual-write problem) is covered in <code>arch-event-driven</code> and <code>staff-exactly-once</code>. The implementation:</p>
${C_OUTBOX}
<ul>
<li><strong>Delivery is at-least-once</strong>: if the relay publishes and crashes before the <code>UPDATE</code>, the next run publishes the same rows again. That is by design; consumers dedup on <code>outbox.id</code>.</li>
<li><strong>Ordering vs parallelism</strong>: <code>SKIP LOCKED</code> lets several relay replicas work in parallel, but two replicas can then publish events of the same order out of sequence. Either run a single leader relay (simple, usually enough for a few thousand events/s), or shard relays by <code>hash(aggregate_id) % N</code>.</li>
<li><strong>Polling vs CDC</strong>: polling adds 200-500 ms of latency and some DB load. Change data capture (Debezium reading the Postgres WAL, with its outbox event router) gives lower latency and no polling queries, at the cost of running Kafka Connect and owning a replication slot. An abandoned replication slot makes Postgres keep WAL forever and fill the disk.</li>
<li><strong>Observe it</strong>: alert on the age of the oldest unpublished row (outbox lag), not just the row count.</li>
</ul>`,
          he: `<p>למה צריך outbox (בעיית ה-dual write) מוסבר ב-<code>arch-event-driven</code> וב-<code>staff-exactly-once</code>. המימוש:</p>
${C_OUTBOX}
<ul>
<li><strong>המסירה היא at-least-once</strong>: אם ה-relay פרסם וקרס לפני ה-<code>UPDATE</code>, הריצה הבאה תפרסם את אותן שורות שוב. זה בכוונה. ה-consumers עושים dedup לפי <code>outbox.id</code>.</li>
<li><strong>סדר מול מקביליות</strong>: <code>SKIP LOCKED</code> מאפשר לכמה replicas של relay לעבוד במקביל, אבל אז שני replicas יכולים לפרסם events של אותה הזמנה בסדר הפוך. או שמריצים relay יחיד עם leader (פשוט, ובדרך כלל מספיק לכמה אלפי events בשנייה), או שמחלקים את ה-relays לפי <code>hash(aggregate_id) % N</code>.</li>
<li><strong>Polling מול CDC</strong>: polling מוסיף 200-500 ms של latency וקצת עומס על ה-DB. Change data capture (Debezium שקורא את ה-WAL של Postgres, עם ה-outbox event router שלו) נותן latency נמוך יותר ובלי queries של polling, במחיר של הרצת Kafka Connect ואחריות על replication slot. Replication slot נטוש גורם ל-Postgres לשמור WAL לנצח ולמלא את הדיסק.</li>
<li><strong>תמדוד את זה</strong>: alert על הגיל של השורה הוותיקה ביותר שלא פורסמה (outbox lag), ולא רק על מספר השורות.</li>
</ul>`
        }
      },
      {
        h: { en: "Consumers: transports, idempotency, retries, DLQ and ordering", he: "Consumers: transports, idempotency, retries, DLQ וסדר" },
        body: {
          en: `<p><code>@nestjs/microservices</code> ships transports for Kafka, RabbitMQ, NATS, Redis, MQTT, gRPC and TCP. <strong>There is no built-in SQS transport</strong>: teams use a community package (for example <code>@ssut/nestjs-sqs</code>), write a <code>CustomTransportStrategy</code>, or run a plain long-polling worker with <code>@aws-sdk/client-sqs</code> (<code>WaitTimeSeconds: 20</code>) inside a Nest provider. A hybrid app serves HTTP and consumes messages in one process; for heavy consumers, deploy the same image twice with a different entrypoint so you can scale them separately.</p>
${C_TRANSPORTS}
<p><strong>Idempotent consumer</strong>: record the message id and apply the effect in the <em>same</em> local transaction. A duplicate then hits the primary key and becomes a no-op. (Key design and dedup windows: <code>pr-idempotency</code>.)</p>
${C_IDEMP}
<p><strong>Retries, DLQ and ordering per broker:</strong></p>
<table>
<tr><th></th><th>SQS</th><th>RabbitMQ</th><th>Kafka</th></tr>
<tr><td>Retry delay</td><td>Visibility timeout; raise it per attempt with <code>ChangeMessageVisibility</code> for backoff</td><td>Retry queues with <code>x-message-ttl</code> that dead-letter back to the main queue (e.g. 10 s, 1 min, 10 min)</td><td>Retry topics (<code>orders.retry.1m</code>, <code>orders.retry.10m</code>) consumed with a delay; never block the partition with long in-process sleeps</td></tr>
<tr><td>DLQ</td><td>Redrive policy, <code>maxReceiveCount</code> (e.g. 5); redrive back with <code>StartMessageMoveTask</code></td><td>Quorum queue <code>x-delivery-limit</code> + dead-letter exchange (RabbitMQ 4 sets a default limit of 20)</td><td>None built in: a dead-letter topic you publish to yourself, with the error and original offset in headers</td></tr>
<tr><td>Ordering</td><td>FIFO queue: order per <code>MessageGroupId</code> (use the order id); dedup window 5 min</td><td>Per queue with one consumer, or <code>x-single-active-consumer</code></td><td>Per partition; key = aggregate id</td></tr>
</table>
<p>Retries and DLQs break strict ordering by definition: message 2 can succeed while message 1 sits in a retry topic. Carry the aggregate <code>version</code> in each event and let the consumer ignore or park anything older than what it has already applied. Make visibility timeout (SQS) or <code>max.poll.interval.ms</code> (Kafka) comfortably larger than the handler's p99, or slow messages get redelivered while still being processed.</p>`,
          he: `<p><code>@nestjs/microservices</code> מגיע עם transports ל-Kafka, RabbitMQ, NATS, Redis, MQTT, gRPC ו-TCP. <strong>אין transport מובנה ל-SQS</strong>: צוותים משתמשים בחבילה של הקהילה (למשל <code>@ssut/nestjs-sqs</code>), כותבים <code>CustomTransportStrategy</code>, או מריצים worker פשוט שעושה long polling עם <code>@aws-sdk/client-sqs</code> (<code>WaitTimeSeconds: 20</code>) בתוך provider של Nest. Hybrid app מגיש HTTP וצורך הודעות באותו תהליך. ל-consumers כבדים, תעשה deploy לאותו image פעמיים עם entrypoint שונה, כדי לעשות להם scale בנפרד.</p>
${C_TRANSPORTS}
<p><strong>Idempotent consumer</strong>: רושמים את ה-message id ומבצעים את ההשפעה ב<em>אותה</em> טרנזקציה מקומית. כפילות נתקלת ב-primary key והופכת ל-no-op. (תכנון keys ו-dedup windows: <code>pr-idempotency</code>.)</p>
${C_IDEMP}
<p><strong>Retries, DLQ וסדר, לפי broker:</strong></p>
<table>
<tr><th></th><th>SQS</th><th>RabbitMQ</th><th>Kafka</th></tr>
<tr><td>השהיה בין retries</td><td>Visibility timeout; מעלים אותו בכל ניסיון עם <code>ChangeMessageVisibility</code> בשביל backoff</td><td>תורי retry עם <code>x-message-ttl</code> שעושים dead-letter חזרה לתור הראשי (למשל 10 שניות, דקה, 10 דקות)</td><td>Retry topics (<code>orders.retry.1m</code>, <code>orders.retry.10m</code>) שנצרכים בהשהיה; אף פעם לא לחסום partition עם sleep ארוך בתהליך</td></tr>
<tr><td>DLQ</td><td>Redrive policy עם <code>maxReceiveCount</code> (למשל 5); מחזירים הודעות עם <code>StartMessageMoveTask</code></td><td><code>x-delivery-limit</code> על quorum queue ועוד dead-letter exchange (ב-RabbitMQ 4 יש limit ברירת מחדל של 20)</td><td>אין מובנה: dead-letter topic שאתה מפרסם אליו בעצמך, עם השגיאה וה-offset המקורי ב-headers</td></tr>
<tr><td>סדר</td><td>תור FIFO: סדר לכל <code>MessageGroupId</code> (תשתמש ב-order id); dedup window של 5 דקות</td><td>לכל תור עם consumer אחד, או <code>x-single-active-consumer</code></td><td>לכל partition; ה-key הוא ה-aggregate id</td></tr>
</table>
<p>Retries ו-DLQs שוברים סדר קפדני מעצם הגדרתם: הודעה 2 יכולה להצליח בזמן שהודעה 1 יושבת ב-retry topic. תעביר את ה-<code>version</code> של ה-aggregate בכל event, ותן ל-consumer להתעלם או להחנות בצד כל דבר ישן ממה שהוא כבר החיל. תגדיר visibility timeout (ב-SQS) או <code>max.poll.interval.ms</code> (ב-Kafka) גדול בהרבה מה-p99 של ה-handler, אחרת הודעות איטיות יימסרו שוב בזמן שהן עוד בטיפול.</p>`
        }
      },
      {
        h: { en: "OpenTelemetry: one trace from HTTP request to consumer", he: "OpenTelemetry: trace אחד מבקשת ה-HTTP ועד ה-consumer" },
        body: {
          en: `<p>Auto-instrumentation patches modules when they're <code>require</code>d, so the SDK must start before Nest loads. It then gives you spans for HTTP in and out, Express/Fastify routes, Nest controllers and handlers, <code>pg</code>, <code>ioredis</code>, <code>kafkajs</code>, <code>amqplib</code> and the AWS SDK, and injects W3C <code>traceparent</code> headers on outgoing calls.</p>
${C_OTEL}
<p>Why the manual part? With a direct <code>producer.send()</code> inside the request, kafkajs instrumentation would propagate the context automatically. But with an outbox, the relay runs later in its own polling loop, so the "current" context is the relay's, and the trace breaks into two. Storing <code>traceparent</code> in the outbox row and re-injecting it on publish restores the end-to-end trace: <code>POST /orders</code> → <code>INSERT outbox</code> → <code>publish</code> → <code>billing process</code> → <code>INSERT invoice</code>.</p>
<p>Parent or link? For one-message-per-handler consumers, making the producer span the parent gives a single readable trace. For batch consumers (one span processing 100 messages from 100 traces), OpenTelemetry's messaging conventions recommend <strong>span links</strong> to each producer context instead of picking one parent. Long fan-out flows (a saga running for hours) are also better as linked traces than as one giant trace.</p>
<blockquote>⚠️ Production tip: export to an OpenTelemetry Collector (see <code>obs-otel-collector</code>), not straight to a vendor. Tail sampling needs every span of a trace on the same collector instance, which means a load-balancing exporter keyed by trace id in front of the sampling tier.</blockquote>`,
          he: `<p>Auto-instrumentation עושה patch למודולים בזמן ה-<code>require</code>, ולכן ה-SDK חייב לעלות לפני ש-Nest נטען. אז מקבלים spans ל-HTTP נכנס ויוצא, routes של Express או Fastify, controllers ו-handlers של Nest, <code>pg</code>, <code>ioredis</code>, <code>kafkajs</code>, <code>amqplib</code> וה-AWS SDK, והוא מזריק headers של <code>traceparent</code> (תקן W3C) לקריאות יוצאות.</p>
${C_OTEL}
<p>למה החלק הידני? עם <code>producer.send()</code> ישיר בתוך הבקשה, ה-instrumentation של kafkajs היה מעביר את ה-context אוטומטית. אבל עם outbox, ה-relay רץ מאוחר יותר ב-loop של polling משלו, כך שה-context ה"נוכחי" הוא של ה-relay, וה-trace נשבר לשניים. שמירת <code>traceparent</code> בשורת ה-outbox והזרקה מחדש בזמן הפרסום מחזירות את ה-trace מקצה לקצה: <code>POST /orders</code> → <code>INSERT outbox</code> → <code>publish</code> → <code>billing process</code> → <code>INSERT invoice</code>.</p>
<p>Parent או link? ב-consumers שמטפלים בהודעה אחת בכל פעם, להפוך את ה-span של ה-producer ל-parent נותן trace אחד וקריא. ב-batch consumers (span אחד שמעבד 100 הודעות מ-100 traces), ה-messaging conventions של OpenTelemetry ממליצים על <strong>span links</strong> לכל context של producer, במקום לבחור parent אחד. גם flows ארוכים עם fan-out (saga שרצה שעות) עדיף לייצג כ-traces מקושרים ולא כ-trace ענק אחד.</p>
<blockquote>⚠️ Production tip: תייצא ל-OpenTelemetry Collector (ראה <code>obs-otel-collector</code>), לא ישירות לספק. Tail sampling צריך את כל ה-spans של trace על אותו instance של collector, ולכן צריך load-balancing exporter לפי trace id לפני שכבת ה-sampling.</blockquote>`
        }
      }
    ],
    diagram: "POST /orders\n   |\n OrdersController --> CommandBus --> PlaceOrderHandler\n                                      |  BEGIN\n                                      |   INSERT orders (aggregate)\n                                      |   INSERT outbox (event + traceparent)\n                                      |  COMMIT\n                                      v\n                              outbox relay (SKIP LOCKED, every 300 ms)\n                                      |  key = order_id, header traceparent\n                                      v\n                         Kafka topic ordering.order-placed.v1 (partition by key)\n                                      |\n            +-------------------------+-------------------------+\n            v                                                   v\n   billing consumer                                    shipping consumer\n   BEGIN                                               ...\n    INSERT processed_messages ON CONFLICT DO NOTHING\n    INSERT invoice\n   COMMIT -> commit offset\n   fails 5x -> retry topics -> billing.dlt",
    handsOn: [
      { cmd: "npm i @nestjs/cqrs @nestjs/microservices kafkajs amqplib amqp-connection-manager @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http", what: { en: "Install the CQRS buses, broker transports and OpenTelemetry.", he: "להתקין את ה-buses של CQRS, transports ל-brokers ו-OpenTelemetry." } },
      { cmd: "psql \"$DATABASE_URL\" -c \"SELECT count(*) AS pending, now() - min(created_at) AS oldest FROM outbox WHERE published_at IS NULL\"", what: { en: "Outbox lag: how many events wait and how old the oldest is. Alert on 'oldest', not on 'pending'.", he: "ה-lag של ה-outbox: כמה events מחכים ומה הגיל של הוותיק ביותר. Alert על הגיל, לא על הכמות." } },
      { cmd: "kafka-consumer-groups.sh --bootstrap-server kafka-0:9092 --describe --group billing", what: { en: "Per-partition LAG of the billing consumer group: one hot partition usually means a hot key.", he: "LAG לכל partition של ה-consumer group של billing. Partition חם אחד בדרך כלל אומר key חם." } },
      { cmd: "aws sqs get-queue-attributes --queue-url \"$DLQ_URL\" --attribute-names ApproximateNumberOfMessages ApproximateAgeOfOldestMessage", what: { en: "Check what's sitting in the DLQ before you redrive it.", he: "לבדוק מה יושב ב-DLQ לפני שמחזירים ממנו הודעות." } },
      { cmd: "aws sqs start-message-move-task --source-arn \"$DLQ_ARN\" --max-number-of-messages-per-second 20", what: { en: "Redrive DLQ messages back to their source queue, throttled, after the bug is fixed. Idempotent consumers make this safe.", he: "להחזיר הודעות מה-DLQ לתור המקורי, בקצב מוגבל, אחרי שהבאג תוקן. Consumers שהם idempotent הופכים את זה לבטוח." } }
    ],
    mnemonic: { en: "\"Record, Store, Relay, Dedup\": the aggregate records the event, the transaction stores it with the state, the relay ships it, the consumer dedups it.", he: "\"רושמים, שומרים, שולחים, מסננים\": ה-aggregate רושם את ה-event, הטרנזקציה שומרת אותו יחד עם ה-state, ה-relay שולח, וה-consumer מסנן כפילויות." },
    pitfalls: [
      { en: "Using @nestjs/cqrs EventBus as if it were a message broker: it's in-memory. A crash after commit loses the event, and a publish before commit announces changes that rolled back.", he: "להשתמש ב-EventBus של @nestjs/cqrs כאילו הוא message broker: הוא in-memory. קריסה אחרי ה-commit מאבדת את ה-event, ופרסום לפני ה-commit מודיע על שינויים שבוטלו ב-rollback." },
      { en: "Running several outbox relays with SKIP LOCKED and assuming per-aggregate order is preserved. It isn't; use a single leader or shard relays by aggregate id.", he: "להריץ כמה relays של outbox עם SKIP LOCKED ולהניח שהסדר לכל aggregate נשמר. הוא לא נשמר. תשתמש ב-leader יחיד או תחלק את ה-relays לפי aggregate id." },
      { en: "Dedup check and side effect in different transactions (or the dedup row written after an external API call): a crash in between either loses the message or double-applies it.", he: "בדיקת dedup וההשפעה בטרנזקציות שונות (או שורת dedup שנכתבת אחרי קריאה ל-API חיצוני): קריסה באמצע או מאבדת את ההודעה או מחילה אותה פעמיים." },
      { en: "Domain events leaking as the public contract: renaming a field in the aggregate breaks three other teams. Publish versioned integration events through a mapper.", he: "Domain events שדולפים בתור החוזה הציבורי: שינוי שם של שדה ב-aggregate שובר שלושה צוותים אחרים. תפרסם integration events עם גרסה, דרך mapper." }
    ],
    interview: [
      {
        q: { en: "How would you structure a NestJS service for an orders domain so it can grow to several teams and maybe split into services later?", he: "איך היית בונה service של NestJS לדומיין של הזמנות, כך שיוכל לגדול לכמה צוותים ואולי להתפצל ל-services בהמשך?" },
        a: { en: "Modular monolith first: one Nest module per bounded context (ordering, billing, shipping), each owning its tables. Inside each, domain (aggregates, value objects, events, ports as abstract classes), application (command/query handlers, transactions), infrastructure (repository and broker adapters) and interface (controllers, consumers). Contexts communicate through versioned integration events via an outbox, never by importing each other's internals, enforced with dependency-cruiser in CI. Because the seams are events and ports, splitting billing into its own deployable is mostly moving the folder and pointing the consumer at the broker. I'd mention I only reach for CQRS read models where read and write shapes differ.", he: "קודם modular monolith: module אחד של Nest לכל bounded context (ordering, billing, shipping), וכל אחד מחזיק את הטבלאות שלו. בתוך כל אחד: domain (aggregates, value objects, events, ports כ-abstract classes), application (command handlers ו-query handlers, טרנזקציות), infrastructure (adapters ל-repository ול-broker) ו-interface (controllers, consumers). Contexts מתקשרים דרך integration events עם גרסה, דרך outbox, ואף פעם לא מייבאים את הפנים אחד של השני. את זה אוכפים עם dependency-cruiser ב-CI. כיוון שהתפרים הם events ו-ports, להוציא את billing ל-deployable משלו זה בעיקר להזיז תיקייה ולחבר את ה-consumer ל-broker. הייתי מציין שאני משתמש ב-read models של CQRS רק איפה שצורת הקריאה וצורת הכתיבה שונות." }
      },
      {
        q: { en: "Your consumer charges a customer when it receives PaymentRequested. Messages are delivered at least once. How do you guarantee one charge?", he: "ה-consumer שלך מחייב לקוח כשהוא מקבל PaymentRequested. ההודעות נמסרות at-least-once. איך מבטיחים חיוב אחד?" },
        a: { en: "Two layers. Locally: a processed_messages table keyed by (consumer, message_id), inserted with ON CONFLICT DO NOTHING in the same transaction as my state change; zero rows inserted means a duplicate, so ack and return. But the charge is an external side effect that can't join my DB transaction, so I also pass a stable idempotency key (derived from the message id or payment id) to the payment provider, which dedups on its side. I record a 'charging' state before the call and the result after, so a crash mid-call is retried with the same key rather than creating a new charge. Retries use backoff; after N failures it goes to the DLQ for a human, and redrive is safe because of both layers.", he: "שתי שכבות. מקומית: טבלת processed_messages עם key של (consumer, message_id), שמכניסים אליה עם ON CONFLICT DO NOTHING באותה טרנזקציה של שינוי ה-state. אפס שורות שנכנסו אומר כפילות, אז עושים ack ויוצאים. אבל החיוב הוא side effect חיצוני שלא יכול להיכנס לטרנזקציה של ה-DB שלי, ולכן אני גם מעביר לספק התשלומים idempotency key יציב (נגזר מה-message id או מה-payment id), והוא עושה dedup אצלו. אני רושם state של 'charging' לפני הקריאה ואת התוצאה אחריה, כך שקריסה באמצע הקריאה תנוסה שוב עם אותו key ולא תיצור חיוב חדש. ה-retries עם backoff, ואחרי N כישלונות ההודעה עוברת ל-DLQ לטיפול אנושי. ה-redrive בטוח בזכות שתי השכבות." }
      },
      {
        q: { en: "Traces stop at the outbox: you see the HTTP request and the INSERT, then a separate trace in the consumer. Why, and how do you fix it?", he: "ה-traces נעצרים ב-outbox: רואים את בקשת ה-HTTP ואת ה-INSERT, ואז trace נפרד ב-consumer. למה, ואיך מתקנים?" },
        a: { en: "Auto-instrumentation propagates the active context at publish time, but the relay publishes later from its own polling loop, so the active context is the relay's, not the original request's. Fix: when writing the outbox row inside the request, call propagation.inject into a carrier and store traceparent (and tracestate if used) in a column. The relay sets that value as the message header. The consumer extracts it and starts a CONSUMER span under it, or links to it for batches. Then one trace spans HTTP, DB, broker and the downstream consumer.", he: "ה-auto-instrumentation מעביר את ה-context הפעיל בזמן הפרסום, אבל ה-relay מפרסם מאוחר יותר מה-loop של ה-polling שלו, כך שה-context הפעיל הוא של ה-relay ולא של הבקשה המקורית. התיקון: כשכותבים את שורת ה-outbox בתוך הבקשה, קוראים ל-propagation.inject לתוך carrier ושומרים את traceparent (ו-tracestate אם משתמשים בו) בעמודה. ה-relay שם את הערך הזה כ-header של ההודעה. ה-consumer עושה extract ופותח span מסוג CONSUMER מתחתיו, או link אליו ב-batches. ככה trace אחד עובר דרך HTTP, DB, broker וה-consumer שבהמשך." }
      }
    ],
    quiz: [
      {
        q: { en: "What happens to an event published on @nestjs/cqrs EventBus if the Pod is killed right after the DB commit, before the handler runs?", he: "מה קורה ל-event שפורסם ב-EventBus של @nestjs/cqrs אם ה-Pod נהרג מיד אחרי ה-commit ב-DB, לפני שה-handler רץ?" },
        options: [
          { en: "It's redelivered when the Pod restarts", he: "הוא נמסר שוב כשה-Pod עולה מחדש" },
          { en: "It's lost: the EventBus is in-memory", he: "הוא אבד: ה-EventBus הוא in-memory" },
          { en: "It's stored in Redis automatically", he: "הוא נשמר ב-Redis אוטומטית" },
          { en: "Nest rolls back the DB transaction", he: "Nest עושה rollback לטרנזקציה ב-DB" }
        ],
        answer: 1,
        explain: { en: "The EventBus is an in-process RxJS stream. Durability across crashes comes from writing events to an outbox in the same transaction.", he: "ה-EventBus הוא stream של RxJS בתוך התהליך. עמידות בקריסות מגיעה מכתיבת ה-events ל-outbox באותה טרנזקציה." }
      },
      {
        q: { en: "Which @nestjs/microservices transport is NOT built in?", he: "איזה transport לא מובנה ב-@nestjs/microservices?" },
        options: [
          { en: "Kafka", he: "Kafka" },
          { en: "RabbitMQ", he: "RabbitMQ" },
          { en: "Amazon SQS", he: "Amazon SQS" },
          { en: "NATS", he: "NATS" }
        ],
        answer: 2,
        explain: { en: "SQS needs a community package, a CustomTransportStrategy, or a plain AWS SDK polling worker.", he: "ל-SQS צריך חבילה של הקהילה, CustomTransportStrategy, או worker פשוט שעושה polling עם ה-AWS SDK." }
      },
      {
        q: { en: "Where must the consumer's dedup record be written?", he: "איפה חייבת להיכתב רשומת ה-dedup של ה-consumer?" },
        options: [
          { en: "In Redis with a 24 h TTL, before processing", he: "ב-Redis עם TTL של 24 שעות, לפני העיבוד" },
          { en: "In the same local transaction as the state change it guards", he: "באותה טרנזקציה מקומית של שינוי ה-state שהיא שומרת עליו" },
          { en: "In the broker's message headers", he: "ב-headers של ההודעה ב-broker" },
          { en: "After committing the Kafka offset", he: "אחרי ה-commit של ה-offset ב-Kafka" }
        ],
        answer: 1,
        explain: { en: "Same transaction means 'recorded as processed' and 'effect applied' commit or roll back together, so a crash can't leave one without the other.", he: "אותה טרנזקציה אומרת ש'נרשם כמעובד' ו'ההשפעה הוחלה' עושים commit או rollback יחד, כך שקריסה לא יכולה להשאיר אחד בלי השני." }
      },
      {
        q: { en: "You need all events of one order processed in sequence on Kafka. What do you set?", he: "אתה צריך שכל ה-events של הזמנה אחת יעובדו לפי הסדר ב-Kafka. מה מגדירים?" },
        options: [
          { en: "One topic per order", he: "Topic לכל הזמנה" },
          { en: "Message key = order id, so all its events land in one partition", he: "Message key = order id, כך שכל ה-events שלה נוחתים ב-partition אחד" },
          { en: "A random key for even load", he: "Key אקראי לפיזור עומס שווה" },
          { en: "acks=0 for lower latency", he: "acks=0 בשביל latency נמוך יותר" }
        ],
        answer: 1,
        explain: { en: "Kafka orders messages only within a partition. Keying by aggregate id keeps one order's events together; on SQS FIFO the equivalent is MessageGroupId.", he: "Kafka שומר סדר רק בתוך partition. Key לפי aggregate id שומר את ה-events של הזמנה אחת יחד. ב-SQS FIFO המקבילה היא MessageGroupId." }
      }
    ],
    playground: "queue",
    related: ["nestjs-in-depth", "pr-ddd", "arch-event-driven", "staff-exactly-once", "pr-idempotency", "arch-queues", "arch-brokers", "pr-queue-kinds", "staff-kafka-deep", "obs-traces", "obs-otel-collector"]
  });

  /* ============================ Lesson 3 ============================ */

  I.lessons.push({
    id: "obs-datadog-victoriametrics",
    track: "observability",
    order: 40,
    icon: "🔭",
    level: 3,
    minutes: 20,
    title: { en: "Datadog, VictoriaMetrics and Grafana: Choosing and Running Your Observability Stack", he: "Datadog, VictoriaMetrics ו-Grafana: לבחור ולהריץ את ה-observability stack" },
    tldr: {
      en: "Datadog buys you one correlated product (metrics, logs, APM) with near-zero ops, billed on hosts, custom-metric cardinality, indexed logs and spans. VictoriaMetrics is a Prometheus-compatible TSDB you run yourself, cheap per series and light on RAM, with stateless vminsert/vmselect around stateful vmstorage. Many teams end up hybrid: Datadog for APM and logs of user-facing services, VictoriaMetrics for high-cardinality infra metrics, Grafana on top.",
      he: "Datadog נותן מוצר אחד מקושר (metrics, logs, APM) כמעט בלי ops, והחיוב לפי hosts, cardinality של custom metrics, logs מאונדקסים ו-spans. VictoriaMetrics הוא TSDB תואם Prometheus שאתה מריץ בעצמך, זול לכל series וחסכוני ב-RAM, עם vminsert ו-vmselect שהם stateless סביב vmstorage שהוא stateful. הרבה צוותים מגיעים ל-hybrid: Datadog ל-APM ול-logs של ה-services מול המשתמשים, VictoriaMetrics ל-metrics של תשתית עם cardinality גבוה, ו-Grafana מעל הכול."
    },
    analogy: {
      en: "Datadog is an all-inclusive hotel: everything is connected, the staff handles everything, and the bill itemizes every towel. VictoriaMetrics is buying an efficient apartment: you fix the plumbing yourself, but the monthly cost barely grows when the family does. Grafana is the window you look through, whichever building you live in.",
      he: "Datadog הוא מלון all-inclusive: הכול מחובר, הצוות מטפל בכול, והחשבון מפרט כל מגבת. VictoriaMetrics זה לקנות דירה יעילה: את האינסטלציה אתה מתקן בעצמך, אבל העלות החודשית כמעט לא גדלה כשהמשפחה גדלה. Grafana הוא החלון שדרכו אתה מסתכל, לא משנה באיזה בניין אתה גר."
    },
    sections: [
      {
        h: { en: "Datadog architecture on Kubernetes", he: "הארכיטקטורה של Datadog ב-Kubernetes" },
        body: {
          en: `<ul>
<li><strong>Node Agent (DaemonSet)</strong>: one per node. Collects host and container metrics from the kubelet, tails container logs, runs integration checks (Postgres, Redis, OpenMetrics endpoints), and hosts the <strong>trace-agent</strong> (APM intake on port 8126) and <strong>DogStatsD</strong> (UDP 8125 or a Unix domain socket).</li>
<li><strong>Cluster Agent (Deployment)</strong>: talks to the API server once instead of every node agent doing it, serves cluster-level metadata, runs <em>cluster checks</em> (one instance of a check for the whole cluster), exposes an External Metrics provider so HPA can scale on Datadog queries, and runs the admission controller that injects <code>DD_*</code> env vars and APM libraries (Single Step Instrumentation).</li>
<li><strong>APM tracers</strong>: <code>dd-trace</code> libraries per language, or OpenTelemetry SDKs sending OTLP to the Agent (the Agent can embed an OpenTelemetry Collector distribution).</li>
<li><strong>Unified service tagging</strong>: three reserved tags, <code>env</code>, <code>service</code>, <code>version</code>, set identically on metrics, logs and traces. They make "jump from this p99 spike to its traces and logs" and deployment tracking per version work. Missing or inconsistent UST is the number one reason Datadog feels disconnected.</li>
</ul>
${C_DD_OPERATOR}`,
          he: `<ul>
<li><strong>Node Agent (DaemonSet)</strong>: אחד לכל node. אוסף metrics של ה-host וה-containers מה-kubelet, עושה tail ללוגים של containers, מריץ integration checks (Postgres, Redis, endpoints של OpenMetrics), ומארח את ה-<strong>trace-agent</strong> (קליטת APM בפורט 8126) ואת <strong>DogStatsD</strong> (UDP 8125 או Unix domain socket).</li>
<li><strong>Cluster Agent (Deployment)</strong>: מדבר עם ה-API server פעם אחת במקום שכל node agent יעשה את זה, מגיש metadata ברמת ה-cluster, מריץ <em>cluster checks</em> (instance אחד של check לכל ה-cluster), חושף External Metrics provider כך ש-HPA יכול לעשות scale לפי queries של Datadog, ומריץ את ה-admission controller שמזריק משתני <code>DD_*</code> וספריות APM (Single Step Instrumentation).</li>
<li><strong>APM tracers</strong>: ספריות <code>dd-trace</code> לכל שפה, או SDKs של OpenTelemetry ששולחים OTLP ל-Agent (ה-Agent יכול להכיל הפצה של OpenTelemetry Collector בתוכו).</li>
<li><strong>Unified service tagging</strong>: שלושה tags שמורים, <code>env</code>, <code>service</code> ו-<code>version</code>, שמוגדרים זהה על metrics, logs ו-traces. הם מה שמאפשר "לקפוץ מה-spike ב-p99 ל-traces וללוגים שלו" ו-deployment tracking לפי גרסה. UST חסר או לא עקבי הוא הסיבה מספר אחת לכך ש-Datadog מרגיש מנותק.</li>
</ul>
${C_DD_OPERATOR}`
        }
      },
      {
        h: { en: "What you actually pay Datadog for, and how to control it", he: "על מה באמת משלמים ל-Datadog, ואיך שולטים בזה" },
        body: {
          en: `<p>Prices change; check the current price list. The <em>drivers</em> are stable:</p>
<table>
<tr><th>Driver</th><th>Billed on</th><th>What blows it up</th><th>Lever</th></tr>
<tr><td>Infrastructure hosts</td><td>Hosts per hour, billed on a high-water mark (the 99th percentile of hourly counts in the month)</td><td>Many small nodes, autoscaling bursts that last days, a container allotment per host exceeded</td><td>Fewer, larger nodes; don't run the Agent on throwaway CI nodes</td></tr>
<tr><td>Custom metrics</td><td>Unique metric name + tag-value combination (a "time series")</td><td>Tags like <code>pod</code>, <code>user_id</code>, <code>url</code>; distributions with percentiles; every Prometheus/OpenMetrics metric you scrape counts as custom</td><td>Fix tags in code; <strong>Metrics without Limits</strong> allowlists the tags that are indexed (you pay a lower rate on what you ingest and the main rate on what you index)</td></tr>
<tr><td>Logs</td><td>GB ingested + events indexed, priced by retention</td><td>Debug logs in prod, health-check access logs, stack traces per retry</td><td>Ingest everything but index selectively: <strong>exclusion filters</strong> per index, cheap long retention in Flex Logs, everything archived to S3/GCS and <strong>rehydrated</strong> on demand</td></tr>
<tr><td>APM</td><td>APM hosts + ingested and indexed spans beyond the per-host allotment</td><td>100% ingestion on high-RPS services</td><td>Ingestion sampling at the tracer/Agent, retention filters for what's indexed (errors, slow traces, a sample of the rest)</td></tr>
</table>
<p>The cardinality math is what surprises people:</p>
${C_DD_COST}
<p><strong>Logs: pipelines, indexes and archives.</strong> Every log goes through <em>pipelines</em> (grok parser, date and status remappers, attribute remapping to standard names like <code>http.status_code</code>), can generate log-based metrics (charged as custom metrics, but kept 15 months and cheap to query), then hits <em>indexes</em>, each with its own retention, daily quota and exclusion filters. Index what on-call searches in the first days; archive everything for compliance and rehydrate when an investigation needs it.</p>`,
          he: `<p>המחירים משתנים, תבדוק את המחירון העדכני. ה-<em>drivers</em> יציבים:</p>
<table>
<tr><th>Driver</th><th>החיוב לפי</th><th>מה מפוצץ אותו</th><th>מנוף</th></tr>
<tr><td>Infrastructure hosts</td><td>Hosts לשעה, לפי high-water mark (האחוזון ה-99 של הספירות השעתיות בחודש)</td><td>הרבה nodes קטנים, autoscaling bursts שנמשכים ימים, חריגה מהקצאת ה-containers לכל host</td><td>פחות nodes וגדולים יותר; לא להריץ את ה-Agent על nodes זמניים של CI</td></tr>
<tr><td>Custom metrics</td><td>צירוף ייחודי של שם metric וערכי tags (כלומר "time series")</td><td>Tags כמו <code>pod</code>, <code>user_id</code>, <code>url</code>; distributions עם percentiles; כל metric של Prometheus או OpenMetrics שעושים לו scrape נחשב custom</td><td>לתקן tags בקוד; <strong>Metrics without Limits</strong> מגדיר allowlist של ה-tags שמאונדקסים (משלמים תעריף נמוך על מה שנקלט ואת התעריף הרגיל על מה שמאונדקס)</td></tr>
<tr><td>Logs</td><td>GB שנקלטו ועוד events מאונדקסים, לפי retention</td><td>Debug logs בפרודקשן, access logs של health checks, stack trace בכל retry</td><td>לקלוט הכול אבל לאנדקס בבחירה: <strong>exclusion filters</strong> לכל index, retention ארוך וזול ב-Flex Logs, והכול ב-archive ל-S3 או GCS עם <strong>rehydration</strong> לפי צורך</td></tr>
<tr><td>APM</td><td>APM hosts ועוד spans שנקלטו ומאונדקסים מעבר להקצאה לכל host</td><td>Ingestion של 100% ב-services עם RPS גבוה</td><td>Ingestion sampling ב-tracer או ב-Agent, ו-retention filters למה שמאונדקס (שגיאות, traces איטיים, וסמפל מהשאר)</td></tr>
</table>
<p>החשבון של ה-cardinality הוא מה שמפתיע אנשים:</p>
${C_DD_COST}
<p><strong>Logs: pipelines, indexes ו-archives.</strong> כל לוג עובר דרך <em>pipelines</em> (grok parser, remappers של תאריך ו-status, מיפוי attributes לשמות סטנדרטיים כמו <code>http.status_code</code>), יכול לייצר log-based metrics (מחויבים כ-custom metrics, אבל נשמרים 15 חודשים וזולים לתשאול), ואז מגיע ל-<em>indexes</em>, שלכל אחד מהם retention, quota יומית ו-exclusion filters משלו. תאנדקס את מה שה-on-call מחפש בימים הראשונים. כל השאר הולך ל-archive בשביל compliance, ועושים לו rehydrate כשחקירה צריכה אותו.</p>`
        }
      },
      {
        h: { en: "VictoriaMetrics architecture and MetricsQL", he: "הארכיטקטורה של VictoriaMetrics ו-MetricsQL" },
        body: {
          en: `<p>VictoriaMetrics (Apache 2.0, with an enterprise edition and a managed cloud offering) is a time series database that speaks the Prometheus protocols: remote_write in, the Prometheus query API out. Grafana treats it as a Prometheus data source.</p>
${C_VM_ARCH}
<ul>
<li><strong>Single-node</strong>: one binary, one disk. Handles on the order of a million active series and hundreds of thousands of samples/s on a modest VM (per its docs; benchmark with your data). Start here; most teams never outgrow it.</li>
<li><strong>Cluster</strong>: <code>vminsert</code> and <code>vmselect</code> are stateless and scale horizontally; <code>vmstorage</code> nodes are shared-nothing and own a slice of the series on local disk (no object storage required). <code>-replicationFactor=2</code> on vminsert writes each sample to two storage nodes; vmselect then needs <code>-dedup.minScrapeInterval</code> to merge the copies. Multi-tenancy is built in through the account id in the URL.</li>
<li><strong>vmagent</strong>: a lightweight Prometheus-compatible scraper and remote_write proxy. It buffers to disk when the backend is unreachable, applies relabeling and stream aggregation, can shard scraping across replicas, and can fan out to several destinations. Teams often run it in front of Datadog-free or mixed stacks as the single metrics collector.</li>
<li><strong>vmalert</strong>: evaluates Prometheus-format alerting and recording rules against vmselect, sends alerts to Alertmanager and writes recording-rule results back via remote_write.</li>
<li><strong>vmauth</strong>, <strong>vmbackup/vmrestore</strong> (snapshots to S3/GCS), <strong>vmctl</strong> (migrate data from Prometheus, Thanos, InfluxDB or another VM).</li>
</ul>
<p><strong>Why it's cheaper to run</strong>: aggressive compression (the project's published numbers are under one byte per sample on typical data, versus roughly 1-2 bytes in Prometheus TSDB) and lower RAM per active series. Vendor benchmarks claim several times less RAM and disk than Prometheus; treat that as "measure on your own workload".</p>
<p><strong>MetricsQL</strong> is a superset of PromQL:</p>
${C_METRICSQL}
<p>One behavioral difference to know before migrating dashboards: <code>rate()</code>/<code>increase()</code> in MetricsQL don't extrapolate to the window edges and include the last sample before the window, so values can differ slightly from Prometheus (for example, <code>increase()</code> on an integer counter returns integers). Alerts with tight thresholds deserve a side-by-side check.</p>`,
          he: `<p>VictoriaMetrics (Apache 2.0, עם גרסת enterprise ושירות מנוהל בענן) הוא database ל-time series שמדבר בפרוטוקולים של Prometheus: remote_write פנימה, ה-query API של Prometheus החוצה. Grafana מתייחס אליו כמו ל-data source של Prometheus.</p>
${C_VM_ARCH}
<ul>
<li><strong>Single-node</strong>: binary אחד, דיסק אחד. לפי התיעוד שלהם הוא מחזיק בסדר גודל של מיליון active series ומאות אלפי samples בשנייה על VM צנוע (תעשה benchmark עם הנתונים שלך). תתחיל כאן. רוב הצוותים אף פעם לא צריכים יותר.</li>
<li><strong>Cluster</strong>: <code>vminsert</code> ו-<code>vmselect</code> הם stateless ועושים להם scale אופקי. ה-nodes של <code>vmstorage</code> הם shared-nothing, וכל אחד מחזיק חלק מה-series על דיסק מקומי (בלי צורך ב-object storage). <code>-replicationFactor=2</code> ב-vminsert כותב כל sample לשני storage nodes, ואז vmselect צריך <code>-dedup.minScrapeInterval</code> כדי למזג את העותקים. Multi-tenancy מובנה, דרך ה-account id שב-URL.</li>
<li><strong>vmagent</strong>: scraper קל תואם Prometheus ו-proxy של remote_write. הוא שומר buffer על הדיסק כשה-backend לא זמין, מפעיל relabeling ו-stream aggregation, יכול לחלק את ה-scraping בין replicas, ויכול לשלוח לכמה יעדים במקביל. צוותים מריצים אותו לעתים קרובות בתור ה-collector היחיד של metrics.</li>
<li><strong>vmalert</strong>: מחשב alerting rules ו-recording rules בפורמט של Prometheus מול vmselect, שולח alerts ל-Alertmanager, וכותב את התוצאות של recording rules חזרה דרך remote_write.</li>
<li><strong>vmauth</strong>, <strong>vmbackup ו-vmrestore</strong> (snapshots ל-S3 או GCS), <strong>vmctl</strong> (מיגרציה של data מ-Prometheus, Thanos, InfluxDB או VM אחר).</li>
</ul>
<p><strong>למה זה זול יותר להרצה</strong>: דחיסה אגרסיבית (המספרים שהפרויקט מפרסם הם פחות מ-byte אחד ל-sample על data טיפוסי, לעומת בערך 1-2 bytes ב-TSDB של Prometheus) ופחות RAM לכל active series. ה-benchmarks של הספק טוענים לפי כמה פחות RAM ודיסק מ-Prometheus. תתייחס לזה כ"תמדוד על ה-workload שלך".</p>
<p><strong>MetricsQL</strong> הוא superset של PromQL:</p>
${C_METRICSQL}
<p>הבדל התנהגותי אחד שכדאי להכיר לפני מיגרציה של dashboards: <code>rate()</code> ו-<code>increase()</code> ב-MetricsQL לא עושים extrapolation לקצוות החלון, וכוללים את ה-sample האחרון שלפני החלון. לכן הערכים יכולים להיות שונים מעט מ-Prometheus (למשל, <code>increase()</code> על counter של מספרים שלמים מחזיר מספרים שלמים). Alerts עם thresholds צמודים צריכים בדיקה צד ליד צד.</p>`
        }
      },
      {
        h: { en: "Comparison: Datadog vs VictoriaMetrics vs Prometheus + Thanos vs Mimir", he: "השוואה: Datadog מול VictoriaMetrics מול Prometheus עם Thanos מול Mimir" },
        body: {
          en: `<table>
<tr><th></th><th>Datadog</th><th>VictoriaMetrics</th><th>Prometheus + Thanos</th><th>Grafana Mimir</th></tr>
<tr><td>Model</td><td>SaaS</td><td>Self-hosted (Apache 2.0) or managed</td><td>Self-hosted (Apache 2.0)</td><td>Self-hosted (AGPLv3) or Grafana Cloud</td></tr>
<tr><td>Signals</td><td>Metrics, logs, APM, RUM, profiling, security, synthetics in one UI</td><td>Metrics (VictoriaLogs and VictoriaTraces are separate products)</td><td>Metrics</td><td>Metrics (Loki, Tempo, Pyroscope for the rest)</td></tr>
<tr><td>Query language</td><td>Datadog query + formulas</td><td>MetricsQL (PromQL superset)</td><td>PromQL</td><td>PromQL</td></tr>
<tr><td>Long-term storage</td><td>Vendor, 15 months for metrics</td><td>Local disks on vmstorage</td><td>Object storage via sidecar, store gateway and compactor</td><td>Object storage</td></tr>
<tr><td>HA</td><td>Vendor SLA</td><td>Replication factor + dedup</td><td>Prometheus HA pairs + dedup in the querier</td><td>Replication across ingesters, zone-aware</td></tr>
<tr><td>Ops burden</td><td>Agents only</td><td>Low: 3 stateless components + 1 stateful</td><td>Medium-high: many components, compaction to babysit</td><td>High in microservices mode; a monolithic mode exists</td></tr>
<tr><td>Cost scales with</td><td>Hosts, custom-metric series, GB of logs, spans</td><td>CPU, RAM and SSD you run</td><td>Prometheus RAM + object storage + query compute</td><td>Object storage + ingester/querier compute</td></tr>
<tr><td>Sweet spot</td><td>Teams that want correlation and no platform work; APM-heavy</td><td>High cardinality on a budget; drop-in for Prometheus</td><td>Existing Prometheus fleets needing global view and long retention</td><td>Large multi-tenant metrics platforms, Grafana-centric orgs</td></tr>
</table>
<p>Prometheus itself (now 3.x, with native histograms and remote_write 2.0) remains the scraper and rule engine of the ecosystem; Thanos, Mimir and VictoriaMetrics all answer "what happens after one Prometheus is not enough": global query, long retention, HA without double alerts. The honest decision factors are cardinality (millions of series favor VM or Mimir over Datadog custom metrics), team size (who is on-call for the TSDB?), and whether you need APM and logs correlated in one place more than you need cheap metrics.</p>`,
          he: `<table>
<tr><th></th><th>Datadog</th><th>VictoriaMetrics</th><th>Prometheus + Thanos</th><th>Grafana Mimir</th></tr>
<tr><td>מודל</td><td>SaaS</td><td>Self-hosted (Apache 2.0) או מנוהל</td><td>Self-hosted (Apache 2.0)</td><td>Self-hosted (AGPLv3) או Grafana Cloud</td></tr>
<tr><td>סיגנלים</td><td>Metrics, logs, APM, RUM, profiling, security ו-synthetics ב-UI אחד</td><td>Metrics (VictoriaLogs ו-VictoriaTraces הם מוצרים נפרדים)</td><td>Metrics</td><td>Metrics (Loki, Tempo ו-Pyroscope לשאר)</td></tr>
<tr><td>שפת query</td><td>Query של Datadog עם formulas</td><td>MetricsQL (superset של PromQL)</td><td>PromQL</td><td>PromQL</td></tr>
<tr><td>אחסון לטווח ארוך</td><td>אצל הספק, 15 חודשים ל-metrics</td><td>דיסקים מקומיים על vmstorage</td><td>Object storage דרך sidecar, store gateway ו-compactor</td><td>Object storage</td></tr>
<tr><td>HA</td><td>SLA של הספק</td><td>Replication factor ו-dedup</td><td>זוגות HA של Prometheus ו-dedup ב-querier</td><td>Replication בין ingesters, מודע ל-zones</td></tr>
<tr><td>עומס ops</td><td>רק agents</td><td>נמוך: 3 רכיבים stateless ואחד stateful</td><td>בינוני-גבוה: הרבה רכיבים, ו-compaction שצריך לשמור עליו</td><td>גבוה ב-microservices mode; יש גם monolithic mode</td></tr>
<tr><td>העלות גדלה לפי</td><td>Hosts, series של custom metrics, GB של logs, spans</td><td>CPU, RAM ו-SSD שאתה מריץ</td><td>RAM של Prometheus, object storage ו-compute לשאילתות</td><td>Object storage ו-compute של ingesters ו-queriers</td></tr>
<tr><td>איפה הוא מצטיין</td><td>צוותים שרוצים קורלציה בלי עבודת platform; הרבה APM</td><td>Cardinality גבוה בתקציב נמוך; תחליף ישיר ל-Prometheus</td><td>Fleets קיימים של Prometheus שצריכים view גלובלי ו-retention ארוך</td><td>Platforms גדולים של metrics עם multi-tenancy, ארגונים שמרוכזים סביב Grafana</td></tr>
</table>
<p>Prometheus עצמו (היום 3.x, עם native histograms ו-remote_write 2.0) נשאר ה-scraper וה-rule engine של האקוסיסטם. Thanos, Mimir ו-VictoriaMetrics כולם עונים על השאלה "מה עושים כש-Prometheus אחד כבר לא מספיק": query גלובלי, retention ארוך, HA בלי alerts כפולים. שיקולי ההחלטה האמיתיים הם cardinality (מיליוני series מטים לטובת VM או Mimir ולא custom metrics של Datadog), גודל הצוות (מי ה-on-call של ה-TSDB?), והאם אתה צריך APM ו-logs מקושרים במקום אחד יותר משאתה צריך metrics זולים.</p>`
        }
      },
      {
        h: { en: "Grafana as the pane, hybrid setups and cardinality control", he: "Grafana כחלון אחד, setups היברידיים ושליטה ב-cardinality" },
        body: {
          en: `<p><strong>Grafana</strong> queries each backend in its own language: VictoriaMetrics as a Prometheus data source (or the dedicated VictoriaMetrics plugin for MetricsQL autocomplete), Loki or VictoriaLogs for logs, Tempo/Jaeger for traces, CloudWatch, Postgres. The Datadog data source is an enterprise plugin (Grafana Enterprise or Cloud); check licensing before planning around it.</p>
<p><strong>A common hybrid</strong>:</p>
<ul>
<li>Datadog: APM, logs and RUM for user-facing services, where trace↔log correlation and on-call UX matter most; a curated set of business metrics.</li>
<li>VictoriaMetrics: kube-state-metrics, cAdvisor, node-exporter, ingress and service-mesh metrics: the high-cardinality infra firehose that would be expensive as Datadog custom metrics.</li>
<li>vmagent as the single scraper; the Datadog Agent configured not to scrape the same OpenMetrics endpoints (otherwise you pay twice).</li>
<li>The same <code>env</code>/<code>service</code>/<code>version</code> labels in both worlds, so a Grafana panel can deep-link to the matching Datadog service page.</li>
</ul>
<p><strong>Cardinality control</strong> is the same discipline in every backend: fix it at the source, cut it at the edge, cap it at the core.</p>
${C_CARD}
<blockquote>⚠️ Production tip: find the offenders before cutting. In VM, <code>/api/v1/status/tsdb</code> and the cardinality explorer in vmui list the top metrics and labels by series count. In Datadog, the Metrics Summary and usage attribution show custom metrics by tag. One un-templated URL label or a <code>pod</code> tag on a histogram is usually most of the bill.</blockquote>`,
          he: `<p><strong>Grafana</strong> מתשאל כל backend בשפה שלו: VictoriaMetrics כ-data source של Prometheus (או ה-plugin הייעודי של VictoriaMetrics בשביל autocomplete של MetricsQL), Loki או VictoriaLogs ל-logs, Tempo או Jaeger ל-traces, CloudWatch, Postgres. ה-data source של Datadog הוא plugin של enterprise (Grafana Enterprise או Cloud), אז תבדוק רישוי לפני שאתה בונה עליו.</p>
<p><strong>Hybrid נפוץ</strong>:</p>
<ul>
<li>Datadog: APM, logs ו-RUM ל-services מול המשתמשים, איפה שהקורלציה בין traces ללוגים וחוויית ה-on-call הכי חשובות; וסט מצומצם של metrics עסקיים.</li>
<li>VictoriaMetrics: kube-state-metrics, cAdvisor, node-exporter, ו-metrics של ingress ו-service mesh. כלומר זרם ה-metrics של התשתית עם ה-cardinality הגבוה, שהיה יקר מאוד בתור custom metrics ב-Datadog.</li>
<li>vmagent בתור ה-scraper היחיד, וה-Datadog Agent מוגדר לא לעשות scrape לאותם endpoints של OpenMetrics (אחרת משלמים פעמיים).</li>
<li>אותם labels של <code>env</code>, <code>service</code> ו-<code>version</code> בשני העולמות, כך ש-panel ב-Grafana יכול לקשר ישירות לדף ה-service המתאים ב-Datadog.</li>
</ul>
<p><strong>שליטה ב-cardinality</strong> היא אותה משמעת בכל backend: לתקן במקור, לחתוך בקצה, להגביל בליבה.</p>
${C_CARD}
<blockquote>⚠️ Production tip: תמצא את האשמים לפני שאתה חותך. ב-VM, <code>/api/v1/status/tsdb</code> וה-cardinality explorer ב-vmui מציגים את ה-metrics וה-labels המובילים לפי מספר series. ב-Datadog, ה-Metrics Summary וה-usage attribution מראים custom metrics לפי tag. Label אחד של URL בלי template, או tag של <code>pod</code> על histogram, הם בדרך כלל רוב החשבון.</blockquote>`
        }
      },
      {
        h: { en: "A migration plan that doesn't lose alerts", he: "תוכנית מיגרציה שלא מאבדת alerts" },
        body: {
          en: `<p>Example: moving infra metrics from Datadog (or a creaking Prometheus) to VictoriaMetrics, keeping Datadog for APM and logs.</p>
<ol>
<li><strong>Inventory</strong> (week 1): top custom metrics by series count and cost, every monitor and SLO that uses them, dashboards with real viewers (check view counts; most dashboards are dead). Decide what is <em>not</em> migrated.</li>
<li><strong>Stand up VM + vmagent</strong> (week 1-2): single-node or a small cluster, vmbackup to object storage, limits on series from day one, self-monitoring dashboards and alerts on VM itself (disk free, ingestion rate, slow inserts, vmagent queue size).</li>
<li><strong>Dual run</strong> (2-4 weeks): vmagent scrapes the same targets that Datadog does. For Prometheus history, backfill with <code>vmctl</code>; Datadog history usually stays in Datadog until it expires.</li>
<li><strong>Translate alerts</strong>: monitors → vmalert rules + Alertmanager routes. Run them in shadow mode (a receiver that posts to a test channel) and compare firing times with the Datadog monitors for at least one incident cycle.</li>
<li><strong>Rebuild dashboards</strong> in Grafana as code (Jsonnet, Terraform or provisioning files), redesigned around golden signals rather than copied 1:1.</li>
<li><strong>Cut over per team</strong>: switch paging to vmalert, then remove the Datadog integrations or drop the metrics through Metrics without Limits. Verify on the next bill, not on the dashboard.</li>
<li><strong>Day 2</strong>: capacity reviews (vmstorage disk and RAM per series), upgrade cadence, runbooks for "vmstorage node lost" and "cardinality spike".</li>
</ol>
<blockquote>💡 Real world: the migration rarely fails on technology. It fails on alert parity (one missing monitor finds out in production) and on the second system nobody turned off. Put an end date on the dual run.</blockquote>`,
          he: `<p>דוגמה: מעבירים metrics של תשתית מ-Datadog (או מ-Prometheus שכבר חורק) ל-VictoriaMetrics, ומשאירים את Datadog ל-APM וללוגים.</p>
<ol>
<li><strong>מיפוי</strong> (שבוע 1): ה-custom metrics המובילים לפי מספר series ועלות, כל monitor ו-SLO שמשתמשים בהם, ו-dashboards שבאמת צופים בהם (תבדוק view counts; רוב ה-dashboards מתים). תחליט מה <em>לא</em> עובר.</li>
<li><strong>להקים VM ו-vmagent</strong> (שבוע 1-2): single-node או cluster קטן, vmbackup ל-object storage, limits על series מהיום הראשון, ו-dashboards ו-alerts של self-monitoring על VM עצמו (מקום פנוי בדיסק, קצב ingestion, slow inserts, גודל התור של vmagent).</li>
<li><strong>ריצה כפולה</strong> (2-4 שבועות): vmagent עושה scrape לאותם targets ש-Datadog אוסף. היסטוריה של Prometheus ממלאים עם <code>vmctl</code>. היסטוריה של Datadog בדרך כלל נשארת ב-Datadog עד שהיא פגה.</li>
<li><strong>לתרגם alerts</strong>: monitors הופכים ל-rules של vmalert ול-routes של Alertmanager. מריצים אותם ב-shadow mode (receiver שכותב לערוץ בדיקות) ומשווים את זמני ה-firing מול ה-monitors של Datadog לפחות לאורך מחזור תקלות אחד.</li>
<li><strong>לבנות dashboards מחדש</strong> ב-Grafana כקוד (Jsonnet, Terraform או provisioning files), בעיצוב מחדש סביב golden signals ולא בהעתקה אחד לאחד.</li>
<li><strong>מעבר לפי צוות</strong>: מעבירים את ה-paging ל-vmalert, ואז מסירים את ה-integrations מ-Datadog או מורידים את ה-metrics דרך Metrics without Limits. מאמתים בחשבונית הבאה, לא ב-dashboard.</li>
<li><strong>Day 2</strong>: סקירות capacity (דיסק ו-RAM של vmstorage לכל series), קצב upgrades, ו-runbooks ל"איבדנו vmstorage node" ול"spike ב-cardinality".</li>
</ol>
<blockquote>💡 Real world: מיגרציה כזו כמעט אף פעם לא נכשלת בגלל טכנולוגיה. היא נכשלת על alert parity (monitor אחד שחסר מתגלה בפרודקשן) ועל המערכת השנייה שאף אחד לא כיבה. תקבע תאריך סיום לריצה הכפולה.</blockquote>`
        }
      }
    ],
    diagram: "                       +-------------------- Grafana (one pane) --------------------+\n                       |                     |                     |                 |\n               VictoriaMetrics          Datadog (plugin)      VictoriaLogs/Loki     Tempo\n               vmselect x K                                                            \n                   |                                                                    \n               vmstorage x M  <--  vminsert x N  <--  vmagent (relabel, stream aggr, disk buffer)\n                                                         ^ scrape\n         kube-state-metrics, cAdvisor, node-exporter, ingress, app /metrics\n\n  Apps with dd-trace / OTel  -->  Datadog Agent (DaemonSet) :8126 APM  :8125 DogStatsD  logs tail\n                                   Cluster Agent (cluster checks, HPA external metrics, admission)\n                                   --> Datadog SaaS (APM, logs, RUM; tags env/service/version)",
    handsOn: [
      { cmd: "kubectl exec -n datadog ds/datadog-agent -c agent -- agent status", what: { en: "Agent health: which checks run, DogStatsD packet counts and drops, APM receiver stats, log sources.", he: "הבריאות של ה-Agent: אילו checks רצים, ספירת packets ו-drops של DogStatsD, סטטיסטיקות של ה-APM receiver ומקורות לוגים." } },
      { cmd: "echo -n \"checkout.attempt:1|c|#env:staging,service:orders,version:1.42.0\" | nc -u -w1 127.0.0.1 8125", what: { en: "Send one DogStatsD counter by hand and find it in the Metrics Explorer: proof that the pipeline and tags work.", he: "לשלוח counter אחד של DogStatsD ידנית ולמצוא אותו ב-Metrics Explorer: הוכחה שה-pipeline וה-tags עובדים." } },
      { cmd: "docker run -d --name vm -p 8428:8428 -v vmdata:/victoria-metrics-data victoriametrics/victoria-metrics:$VM_VERSION -retentionPeriod=90d -selfScrapeInterval=15s", what: { en: "A single-node VictoriaMetrics in one command (pin a real version); it scrapes itself, so you have data to query at :8428/vmui right away.", he: "VictoriaMetrics בגרסת single-node בפקודה אחת (תקבע גרסה אמיתית). הוא עושה scrape לעצמו, כך שיש לך מיד data לתשאל ב-8428/vmui." } },
      { cmd: "curl -s 'http://vmselect:8481/select/0/prometheus/api/v1/status/tsdb?topN=10' | jq '.data.seriesCountByMetricName, .data.seriesCountByLabelName'", what: { en: "Top metrics and labels by series count: your cardinality hit list.", he: "ה-metrics וה-labels המובילים לפי מספר series: רשימת המטרות שלך ל-cardinality." } },
      { cmd: "vmctl prometheus --prom-snapshot=/prometheus/snapshots/20261117T000000Z-1a2b3c --vm-addr=http://vminsert:8480 --vm-account-id=0", what: { en: "Backfill history from a Prometheus TSDB snapshot into a VM cluster during the dual run.", he: "למלא היסטוריה מ-snapshot של ה-TSDB של Prometheus לתוך cluster של VM בזמן הריצה הכפולה." } }
    ],
    mnemonic: { en: "\"Datadog bills what you tag; VictoriaMetrics bills what you run.\" And for cardinality: fix at the source, cut at the edge, cap at the core.", he: "\"ב-Datadog משלמים על מה שאתה מתייג, ב-VictoriaMetrics על מה שאתה מריץ.\" ול-cardinality: לתקן במקור, לחתוך בקצה, להגביל בליבה." },
    pitfalls: [
      { en: "Adding a pod, user_id or raw URL tag to a Datadog distribution with percentiles: every combination is multiplied by up to 10 custom metrics, and rolling deploys add new pod values every hour.", he: "להוסיף tag של pod, user_id או URL גולמי ל-distribution ב-Datadog עם percentiles: כל צירוף מוכפל בעד 10 custom metrics, ו-rolling deploys מוסיפים ערכי pod חדשים כל שעה." },
      { en: "Letting the Datadog Agent autodiscover every /metrics endpoint: each Prometheus series becomes a billable custom metric. Scrape infra metrics with vmagent or Prometheus, and send Datadog only what you curate.", he: "לתת ל-Datadog Agent לגלות אוטומטית כל endpoint של /metrics: כל series של Prometheus הופך ל-custom metric בתשלום. תעשה scrape ל-metrics של תשתית עם vmagent או Prometheus, ותשלח ל-Datadog רק את מה שבחרת." },
      { en: "Running a VM cluster with replicationFactor=2 but no -dedup.minScrapeInterval on vmselect: duplicated samples skew sum() and rate() results.", he: "להריץ cluster של VM עם replicationFactor=2 בלי -dedup.minScrapeInterval ב-vmselect: samples כפולים מעוותים את התוצאות של sum() ו-rate()." },
      { en: "Indexing every log line in Datadog 'just in case' instead of exclusion filters plus archives and rehydration: indexed events are usually the biggest line on the logs bill.", he: "לאנדקס כל שורת לוג ב-Datadog \"ליתר ביטחון\" במקום exclusion filters עם archives ו-rehydration: events מאונדקסים הם בדרך כלל השורה הכי גדולה בחשבון של ה-logs." }
    ],
    interview: [
      {
        q: { en: "Our Datadog bill doubled in a quarter, mostly custom metrics. How do you investigate and fix it without losing visibility?", he: "החשבון של Datadog הוכפל ברבעון, בעיקר custom metrics. איך היית חוקר ומתקן בלי לאבד visibility?" },
        a: { en: "First attribute: Metrics Summary and usage attribution by metric and by tag show which metric names and which tag keys create the series. Typical culprits: a pod or container_id tag on distributions with percentiles (x10 per combination), un-templated URL paths, user or tenant ids, and OpenMetrics checks scraping whole exporters. Then fix in layers: remove high-cardinality tags in code (or aggregate before emitting), use Metrics without Limits to index only the tags people query, disable percentiles where nobody uses them, and move bulk infra metrics to a Prometheus-compatible store like VictoriaMetrics with Grafana on top. Put a guardrail in place: a CI or usage alert on new metrics with more than N series. Verify against the next invoice, not the estimate.", he: "קודם attribution: ה-Metrics Summary וה-usage attribution לפי metric ולפי tag מראים אילו שמות metrics ואילו tag keys יוצרים את ה-series. החשודים הרגילים: tag של pod או container_id על distributions עם percentiles (פי 10 לכל צירוף), נתיבי URL בלי template, מזהי user או tenant, ו-checks של OpenMetrics שעושים scrape ל-exporters שלמים. אחר כך מתקנים בשכבות: להוריד tags עם cardinality גבוה בקוד (או לעשות aggregation לפני השליחה), להשתמש ב-Metrics without Limits כדי לאנדקס רק tags שבאמת מתשאלים, לכבות percentiles איפה שאף אחד לא משתמש בהם, ולהעביר את המסה של metrics התשתית ל-store תואם Prometheus כמו VictoriaMetrics עם Grafana מעליו. ולשים guardrail: alert ב-CI או על usage כשנוצר metric חדש עם יותר מ-N series. ולאמת מול החשבונית הבאה, לא מול ההערכה." }
      },
      {
        q: { en: "Explain VictoriaMetrics cluster components. Which are stateful, how do you scale writes vs reads, and what happens when a vmstorage node dies?", he: "תסביר את הרכיבים של VictoriaMetrics cluster. מה stateful, איך עושים scale לכתיבות מול קריאות, ומה קורה כש-node של vmstorage מת?" },
        a: { en: "vminsert receives remote_write and spreads series across vmstorage nodes by consistent hashing; vmselect fans queries out to all vmstorage nodes and merges results. Both are stateless, so scale writes by adding vminsert and reads by adding vmselect, behind vmauth or a load balancer. vmstorage is the only stateful part: shared-nothing nodes with local disks; you add nodes for capacity, and new series start landing on them. If a vmstorage node dies: with replicationFactor=1, vminsert reroutes new data to healthy nodes (so ingestion continues) but that node's historical data is missing from queries until it returns, and vmselect returns partial responses unless you deny them. With replicationFactor=N, you tolerate N-1 node failures with complete results, at N times the storage, and vmselect must dedup.", he: "vminsert מקבל remote_write ומפזר series בין nodes של vmstorage לפי consistent hashing. vmselect שולח queries לכל ה-nodes של vmstorage וממזג את התוצאות. שניהם stateless, אז עושים scale לכתיבות עם עוד vminsert ולקריאות עם עוד vmselect, מאחורי vmauth או load balancer. vmstorage הוא החלק היחיד שהוא stateful: nodes מסוג shared-nothing עם דיסקים מקומיים. מוסיפים nodes בשביל capacity, ו-series חדשים מתחילים לנחות עליהם. אם node של vmstorage מת: עם replicationFactor=1, vminsert מנתב data חדש ל-nodes תקינים (כך שה-ingestion ממשיך), אבל ה-data ההיסטורי של ה-node הזה חסר ב-queries עד שהוא חוזר, ו-vmselect מחזיר partial responses אלא אם חסמת אותן. עם replicationFactor=N שורדים נפילה של N-1 nodes עם תוצאות מלאות, במחיר של פי N אחסון, ו-vmselect חייב לעשות dedup." }
      },
      {
        q: { en: "Datadog, VictoriaMetrics, or Prometheus + Thanos/Mimir for a 40-engineer company with 6 Kubernetes clusters? Defend your choice.", he: "Datadog, VictoriaMetrics, או Prometheus עם Thanos או Mimir, לחברה של 40 מהנדסים עם 6 clusters של Kubernetes? תגן על הבחירה." },
        a: { en: "It depends on two numbers: active series and how much platform capacity we have. With no dedicated observability engineer, Datadog's correlation (UST across APM, logs and metrics) and zero ops are worth a lot, so I'd use it for APM and logs, with strict tag hygiene and log indexing rules from day one. For infra metrics from 6 clusters (likely millions of series once kube-state-metrics, cAdvisor and histograms are in), I'd run vmagent in each cluster writing to a central VictoriaMetrics (single-node first, cluster when it outgrows one box), with vmalert and Grafana. That's a handful of components versus Thanos' sidecars, store gateways and compactor, or Mimir's microservices. I'd revisit Mimir if we needed object-storage economics for years of retention or strong multi-tenancy at much larger scale.", he: "זה תלוי בשני מספרים: כמה active series יש וכמה capacity של platform יש לנו. בלי מהנדס observability ייעודי, הקורלציה של Datadog (UST בין APM, logs ו-metrics) והעובדה שאין ops שוות הרבה, אז הייתי משתמש בו ל-APM וללוגים, עם היגיינת tags וכללי אינדוקס ללוגים מהיום הראשון. ל-metrics של תשתית מ-6 clusters (כנראה מיליוני series ברגע ש-kube-state-metrics, cAdvisor ו-histograms נכנסים), הייתי מריץ vmagent בכל cluster שכותב ל-VictoriaMetrics מרכזי (קודם single-node, ו-cluster כשמכונה אחת כבר לא מספיקה), עם vmalert ו-Grafana. אלה מעט רכיבים, לעומת ה-sidecars, ה-store gateways וה-compactor של Thanos, או ה-microservices של Mimir. הייתי חוזר ל-Mimir אם נצטרך את הכלכלה של object storage ל-retention של שנים, או multi-tenancy חזק ב-scale הרבה יותר גדול." }
      }
    ],
    quiz: [
      {
        q: { en: "A DogStatsD distribution with percentiles enabled has tags endpoint (20 values) and status (5 values). Roughly how many custom metrics?", he: "Distribution של DogStatsD עם percentiles פעילים, עם tags של endpoint (20 ערכים) ו-status (5 ערכים). בערך כמה custom metrics?" },
        options: [
          { en: "1", he: "1" },
          { en: "100", he: "100" },
          { en: "1,000", he: "1,000" },
          { en: "25", he: "25" }
        ],
        answer: 2,
        explain: { en: "20 × 5 = 100 tag combinations; a distribution counts 5 aggregations per combination, and percentiles add 5 more: 100 × 10 = 1,000.", he: "20 × 5 = 100 צירופי tags. Distribution נספר כ-5 aggregations לכל צירוף, ו-percentiles מוסיפים עוד 5: 100 × 10 = 1,000." }
      },
      {
        q: { en: "Which VictoriaMetrics cluster component is stateful?", he: "איזה רכיב ב-VictoriaMetrics cluster הוא stateful?" },
        options: [
          { en: "vminsert", he: "vminsert" },
          { en: "vmselect", he: "vmselect" },
          { en: "vmstorage", he: "vmstorage" },
          { en: "vmalert", he: "vmalert" }
        ],
        answer: 2,
        explain: { en: "vmstorage owns the data on local disk. vminsert and vmselect are stateless and scale horizontally; vmalert only keeps optional alert state.", he: "vmstorage מחזיק את ה-data על דיסק מקומי. vminsert ו-vmselect הם stateless ועושים להם scale אופקי. vmalert שומר רק state אופציונלי של alerts." }
      },
      {
        q: { en: "What does Datadog unified service tagging consist of?", he: "ממה מורכב ה-unified service tagging של Datadog?" },
        options: [
          { en: "host, region, team", he: "host, region, team" },
          { en: "env, service, version on metrics, logs and traces", he: "env, service, version על metrics, logs ו-traces" },
          { en: "trace_id and span_id in every metric", he: "trace_id ו-span_id בכל metric" },
          { en: "A tag allowlist in Metrics without Limits", he: "Allowlist של tags ב-Metrics without Limits" }
        ],
        answer: 1,
        explain: { en: "The three reserved tags env, service and version, applied consistently to all telemetry, enable correlation and deployment tracking.", he: "שלושת ה-tags השמורים env, service ו-version, כשהם מוגדרים באופן עקבי על כל הטלמטריה, מאפשרים קורלציה ו-deployment tracking." }
      },
      {
        q: { en: "Cheapest way to keep 1 year of Datadog logs for compliance while on-call searches the last 7 days?", he: "הדרך הזולה ביותר לשמור שנה של logs ב-Datadog בשביל compliance, כשה-on-call מחפש רק ב-7 הימים האחרונים?" },
        options: [
          { en: "One index with 365-day retention", he: "Index אחד עם retention של 365 ימים" },
          { en: "Index with 7-day retention and exclusion filters, plus an archive to object storage with rehydration on demand", he: "Index עם retention של 7 ימים ו-exclusion filters, ועוד archive ל-object storage עם rehydration לפי צורך" },
          { en: "Turn logs into custom metrics", he: "להפוך את הלוגים ל-custom metrics" },
          { en: "Disable log collection and use APM", he: "לכבות איסוף לוגים ולהשתמש ב-APM" }
        ],
        answer: 1,
        explain: { en: "Indexing is priced by retention; archives in your own bucket are cheap, and rehydration pulls back only the slice an investigation needs.", he: "Indexing מתומחר לפי retention. Archives ב-bucket שלך זולים, ו-rehydration מחזיר רק את החתיכה שחקירה צריכה." }
      }
    ],
    related: ["obs-metrics", "obs-prometheus-deep", "obs-otel-collector", "obs-logging-pipeline", "obs-traces", "obs-dashboards", "obs-alerting", "obs-intro", "cloud-finops"]
  });

  /* ============================ Glossary ============================ */

  I.glossary.push(
    { term: "NestJS interceptor", track: "architecture", lesson: "nestjs-in-depth",
      def: { en: "A NestJS class that wraps a route handler as an RxJS stream, running logic before and after it: logging, timing, response mapping, caching, timeouts.", he: "מחלקה ב-NestJS שעוטפת route handler כ-stream של RxJS ומריצה לוגיקה לפניו ואחריו: logging, מדידת זמנים, מיפוי תשובות, caching ו-timeouts." } },
    { term: "Request-scoped provider", track: "architecture", lesson: "nestjs-in-depth",
      def: { en: "A NestJS provider created once per incoming request (Scope.REQUEST). The scope bubbles up to every consumer, so it costs allocations on every request.", he: "Provider ב-NestJS שנוצר פעם אחת לכל בקשה נכנסת (Scope.REQUEST). ה-scope מבעבע לכל מי שצורך אותו, ולכן הוא עולה בהקצאות בכל בקשה." } },
    { term: "Idempotent consumer", track: "architecture", lesson: "nestjs-ddd-event-driven",
      def: { en: "A message handler that records each message id in a dedup table in the same transaction as its side effect, so at-least-once redeliveries become no-ops.", he: "Handler של הודעות שרושם כל message id בטבלת dedup באותה טרנזקציה של ההשפעה שלו, כך שמסירות חוזרות של at-least-once הופכות ל-no-op." } },
    { term: "DogStatsD", track: "observability", lesson: "obs-datadog-victoriametrics",
      def: { en: "The Datadog Agent's StatsD-compatible metrics server (UDP 8125 or a Unix socket) with tag support; every unique tag combination is a billable custom metric.", he: "שרת ה-metrics של ה-Datadog Agent, תואם StatsD (UDP 8125 או Unix socket) ועם תמיכה ב-tags. כל צירוף ייחודי של tags הוא custom metric בתשלום." } },
    { term: "Unified service tagging", track: "observability", lesson: "obs-datadog-victoriametrics",
      def: { en: "Datadog's convention of the reserved tags env, service and version on all metrics, logs and traces, enabling cross-signal correlation and deployment tracking.", he: "המוסכמה של Datadog לשלושה tags שמורים, env, service ו-version, על כל ה-metrics, ה-logs וה-traces. היא מאפשרת קורלציה בין סיגנלים ו-deployment tracking." } },
    { term: "vmagent", track: "observability", lesson: "obs-datadog-victoriametrics",
      def: { en: "VictoriaMetrics' lightweight Prometheus-compatible scraper and remote_write proxy, with on-disk buffering, relabeling, stream aggregation and series limits.", he: "ה-scraper הקל של VictoriaMetrics, תואם Prometheus, שמשמש גם כ-proxy ל-remote_write, עם buffer על דיסק, relabeling, stream aggregation ו-limits על series." } }
  );
})();
