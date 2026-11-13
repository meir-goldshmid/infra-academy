window.INFRA = window.INFRA || { lessons: [], glossary: [], scenarios: [] };
/* Principal track — testing & quality craft: unit tests, integration/contract/e2e, performance, code review.
   Code samples live in constants so the English and Hebrew bodies show identical code. */
(function () {
const C = {
pyPricing: `# pricing.py — the code under test (same idea in every language)
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class Item:
    sku: str
    price: Decimal
    qty: int

def order_total(items, coupon=None):
    subtotal = sum((i.price * i.qty for i in items), Decimal("0"))
    if coupon == "SAVE10" and subtotal &gt;= Decimal("100"):
        subtotal *= Decimal("0.9")
    return subtotal.quantize(Decimal("0.01"))`,
pyAAA: `# test_pricing.py — one behavior, AAA, a name that reads like a spec
from decimal import Decimal as D
import pytest
from pricing import Item, order_total

def test_save10_applies_at_exactly_100():
    # Arrange
    items = [Item("MUG", D("50.00"), 2)]
    # Act
    total = order_total(items, coupon="SAVE10")
    # Assert
    assert total == D("90.00")

@pytest.mark.parametrize("items, coupon, expected", [
    ([], None, D("0.00")),                          # empty cart
    ([Item("A", D("50"), 2)], "SAVE10", D("90.00")),  # boundary
    ([Item("A", D("99.99"), 1)], "SAVE10", D("99.99")),  # below
    ([Item("A", D("50"), 2)], "BOGUS", D("100.00")),  # bad code
])
def test_order_total_table(items, coupon, expected):
    assert order_total(items, coupon) == expected`,
jest: `// pricing.test.js — Jest, table-driven
const { orderTotal } = require("./pricing");

describe("orderTotal", () =&gt; {
  test.each([
    [[], null, 0],
    [[{ price: 50, qty: 2 }], "SAVE10", 90],
    [[{ price: 99.99, qty: 1 }], "SAVE10", 99.99],
    [[{ price: 50, qty: 2 }], "BOGUS", 100],
  ])("items=%j coupon=%s -&gt; %d", (items, coupon, exp) =&gt; {
    expect(orderTotal(items, coupon)).toBeCloseTo(exp, 2);
  });

  it("rejects negative quantities", () =&gt; {
    expect(() =&gt; orderTotal([{ price: 5, qty: -1 }]))
      .toThrow(/qty must be positive/);
  });
});`,
junit: `// OrderTotalTest.java — JUnit 5 parameterized
class OrderTotalTest {
  @ParameterizedTest(name = "{0} x{1} coupon={2} -&gt; {3}")
  @CsvSource({
    "50.00, 2, SAVE10, 90.00",
    "99.99, 1, SAVE10, 99.99",
    "50.00, 2, BOGUS,  100.00"
  })
  void totals(BigDecimal price, int qty, String coupon,
              BigDecimal expected) {
    var items = List.of(new Item("A", price, qty));
    assertEquals(expected, Pricing.orderTotal(items, coupon));
  }
}

// C# xUnit: same shape
// [Theory]
// [InlineData(50.0, 2, "SAVE10", 90.0)]
// public void Totals(decimal p, int q, string c, decimal e)
//   =&gt; Assert.Equal(e, Pricing.OrderTotal(new[]{ new Item("A",p,q) }, c));`,
builder: `# test data builder: defaults for everything, override what matters
class CartBuilder:
    def __init__(self):
        self.items = [Item("MUG", D("10.00"), 1)]
        self.expires_at = datetime(2030, 1, 1, tzinfo=UTC)
    def with_items(self, *items):
        self.items = list(items); return self
    def expired_at(self, ts):
        self.expires_at = ts; return self
    def build(self):
        return Cart(id="c-1", items=self.items,
                    expires_at=self.expires_at)

cart = CartBuilder().expired_at(NOW - timedelta(minutes=1)).build()`,
service: `# checkout.py — a service with 3 collaborators
class CheckoutService:
    def __init__(self, repo, clock, mailer):
        self.repo, self.clock, self.mailer = repo, clock, mailer

    def place(self, cart_id):
        cart = self.repo.get_cart(cart_id)
        if cart.expires_at &lt; self.clock.now():
            raise CartExpired(cart_id)
        order = self.repo.save_order(cart)
        self.mailer.send_receipt(order.id)
        return order`,
doubles: `# the doubles, by hand (no framework magic needed)
class FixedClock:                 # STUB: returns canned answers
    def __init__(self, t): self.t = t
    def now(self): return self.t

class InMemoryRepo:               # FAKE: a real, simplified impl
    def __init__(self): self.carts, self.orders = {}, []
    def get_cart(self, cid): return self.carts[cid]
    def save_order(self, cart):
        o = Order(id=f"o-{len(self.orders)+1}", cart=cart)
        self.orders.append(o); return o

class SpyMailer:                  # SPY: records what happened
    def __init__(self): self.sent = []
    def send_receipt(self, oid): self.sent.append(oid)

def test_place_order_sends_one_receipt():
    repo, mailer = InMemoryRepo(), SpyMailer()
    repo.carts["c-1"] = CartBuilder().build()
    svc = CheckoutService(repo, FixedClock(NOW), mailer)
    order = svc.place("c-1")
    assert mailer.sent == [order.id]          # state + spy
    assert len(repo.orders) == 1

def test_expired_cart_is_rejected():
    repo = InMemoryRepo()
    repo.carts["c-1"] = CartBuilder().expired_at(NOW).build()
    svc = CheckoutService(repo, FixedClock(NOW + timedelta(seconds=1)),
                          mailer=None)       # DUMMY: never used
    with pytest.raises(CartExpired):
        svc.place("c-1")`,
mock: `# MOCK: pre-programmed expectations, verified on interaction
from unittest.mock import Mock
mailer = Mock()
svc = CheckoutService(repo, FixedClock(NOW), mailer)
svc.place("c-1")
mailer.send_receipt.assert_called_once_with("o-1")

# over-specified (brittle): asserts HOW, not WHAT
repo = Mock()
repo.get_cart.return_value = cart
svc.place("c-1")
repo.get_cart.assert_called_once_with("c-1")   # refactor =&gt; red
repo.save_order.assert_called_once()           # even if correct`,
hypo: `# property-based: describe a rule, let the tool hunt inputs
from hypothesis import given, strategies as st

items_st = st.lists(st.builds(
    Item, st.just("A"),
    st.decimals(min_value=0, max_value=1000, places=2),
    st.integers(min_value=1, max_value=10)), max_size=20)

@given(items_st)
def test_coupon_never_increases_total(items):
    assert order_total(items, "SAVE10") &lt;= order_total(items)

@given(items_st)
def test_total_is_never_negative(items):
    assert order_total(items) &gt;= 0

// fast-check (JS):
// fc.assert(fc.property(fc.array(itemArb), items =&gt;
//   orderTotal(items, "SAVE10") &lt;= orderTotal(items)));`,
asyncTime: `# async code: await it, don't sleep
@pytest.mark.asyncio
async def test_fetch_rate_times_out():
    client = FakeFx(delay=5)
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(client.rate("USD", "ILS"), 0.1)

// Jest: return/await the promise, or the test passes vacuously
await expect(fx.rate("USD", "XXX")).rejects.toThrow("unknown");

// Jest fake timers for TTL logic
jest.useFakeTimers();
cache.set("k", 1, { ttlMs: 60000 });
jest.advanceTimersByTime(60001);
expect(cache.get("k")).toBeUndefined();

# randomness: inject the RNG, seed it
rng = random.Random(42)
assert pick_replica(["a", "b", "c"], rng) == "a"`,
tdd: `TDD loop on a new rule: "VIP customers get free shipping"

RED      def test_vip_gets_free_shipping():
             assert shipping(total=D("20"), vip=True) == D("0")
         -&gt; fails: shipping() has no vip param

GREEN    def shipping(total, vip=False):
             if vip: return D("0")
             return D("0") if total &gt;= 100 else D("9.90")
         -&gt; passes (simplest thing that works)

REFACTOR extract FREE_SHIPPING_MIN = D("100"), rename, re-run
         -&gt; still green; commit. Next test: VIP + coupon stack?`,
mut: `$ mutmut run && mutmut results          # Python
$ npx stryker run                        # JS/TS
$ mvn org.pitest:pitest-maven:mutationCoverage   # Java

Survived mutant (pricing.py:13):
-    if coupon == "SAVE10" and subtotal &gt;= Decimal("100"):
+    if coupon == "SAVE10" and subtotal &gt; Decimal("100"):
Line coverage: 100%  |  Mutation score: 83%
=&gt; no test at exactly 100.00. Add the boundary case, mutant dies.`,

tcJava: `// Java + Testcontainers + Flyway: a real Postgres per test class
@Testcontainers
class OrderRepoIT {
  @Container
  static PostgreSQLContainer&lt;?&gt; pg =
      new PostgreSQLContainer&lt;&gt;("postgres:16-alpine");

  static DataSource ds;

  @BeforeAll
  static void migrate() {
    ds = DataSources.of(pg.getJdbcUrl(),
        pg.getUsername(), pg.getPassword());
    Flyway.configure().dataSource(ds).load().migrate();
  }

  @Test
  void savesAndLoadsOrder() {
    var repo = new OrderRepo(ds);
    var id = repo.save(new Order("c-9", 12900));
    assertEquals(12900, repo.find(id).totalCents());
  }

  @Test
  void uniqueIdempotencyKeyRejectsDuplicates() {
    var repo = new OrderRepo(ds);
    repo.save(new Order("c-9", 100, "key-1"));
    assertThrows(DuplicateKeyException.class,
        () -&gt; repo.save(new Order("c-9", 100, "key-1")));
  }
}`,
tcPy: `# Python: migrations must apply cleanly on a fresh DB
from testcontainers.postgres import PostgresContainer
import sqlalchemy as sa

def test_migrations_apply_cleanly():
    with PostgresContainer("postgres:16-alpine") as pg:
        eng = sa.create_engine(pg.get_connection_url())
        alembic_upgrade(eng, "head")
        alembic_downgrade(eng, "-1")      # reversible?
        alembic_upgrade(eng, "head")
        with eng.connect() as c:
            n = c.execute(sa.text("select count(*) from orders"))
            assert n.scalar() == 0

// Node: Kafka in a container
const kafka = await new KafkaContainer(
  "confluentinc/cp-kafka:7.6.0").start();
const brokers = [kafka.getHost() + ":" + kafka.getMappedPort(9093)];`,
pact: `// consumer side (web app): record what we need from orders-api
const { PactV3, MatchersV3 } = require("@pact-foundation/pact");
const { like } = MatchersV3;
const pact = new PactV3({ consumer: "web", provider: "orders-api" });

it("gets an order", () =&gt; {
  pact.given("order o-81 exists")
    .uponReceiving("a request for order o-81")
    .withRequest({ method: "GET", path: "/orders/o-81" })
    .willRespondWith({ status: 200,
      body: like({ id: "o-81", totalCents: 12900 }) });
  return pact.executeTest(async (mock) =&gt; {
    const o = await getOrder(mock.url, "o-81");
    expect(o.totalCents).toBe(12900);
  });
});
// =&gt; writes pacts/web-orders-api.json, published to the broker`,
pactFlow: `# provider CI: replay every consumer's contract against the real API
$ ./gradlew pactVerify -Ppact.verifier.publishResults=true

# before deploying ANY side to prod:
$ pact-broker can-i-deploy --pacticipant web \\
    --version $GIT_SHA --to-environment production
Computer says yes \\o/   (or: no — orders-api v2.3 breaks web)`,
await: `// async consumer: assert "eventually", never Thread.sleep(5000)
publish("orders", orderPlaced("o-81"));

await().atMost(Duration.ofSeconds(10))
       .pollInterval(Duration.ofMillis(100))
       .untilAsserted(() -&gt;
           assertEquals("RESERVED", stock.status("o-81")));

# Python equivalent
def eventually(fn, timeout=10, every=0.1):
    end = time.monotonic() + timeout
    while True:
        try: return fn()
        except AssertionError:
            if time.monotonic() &gt; end: raise
            time.sleep(every)`,
pw: `// e2e/checkout.spec.ts — Playwright, user-facing locators
import { test, expect } from "@playwright/test";

test("checkout happy path", async ({ page }) =&gt; {
  await page.goto("/products/mug-1");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("link", { name: "Checkout" }).click();
  await page.getByLabel("Card number").fill("4242424242424242");
  await page.getByRole("button", { name: "Pay" }).click();
  await expect(page.getByText("Order confirmed")).toBeVisible();
});

// playwright.config.ts
// use: { baseURL: process.env.PREVIEW_URL,
//        trace: "on-first-retry", screenshot: "only-on-failure" }`,
ci: `stage           time   what                              gate
lint+types      1 min  ruff/eslint, mypy/tsc             fail
unit (x4 shard) 2 min  pytest -n auto / jest --shard     fail
integration     6 min  testcontainers, migrations        fail
contract        2 min  pact verify + can-i-deploy        fail
preview env     4 min  helm install pr-1234 namespace    -
e2e smoke (x4)  6 min  playwright --shard=1/4 ...        fail
nightly         45 min full e2e, soak, mutation tests    report`
};

INFRA.lessons.push({
  id: "pr-unit-testing-craft",
  track: "principal",
  order: 100,
  icon: "🧪",
  level: 3,
  minutes: 18,
  title: { en: "Unit Testing Craft: pytest, Jest & JUnit Side by Side", he: "אומנות ה-Unit Test: pytest, Jest ו-JUnit זה לצד זה" },
  tldr: {
    en: "A great unit test checks one behavior through the public API, runs in milliseconds, never flakes, and fails with a message that tells you what broke — use fakes over mocks, inject time and randomness, and let mutation testing tell you whether your tests actually catch bugs.",
    he: "Unit test מצוין בודק התנהגות אחת דרך ה-API הציבורי, רץ במילישניות, אף פעם לא flaky, ונכשל עם הודעה שאומרת מה נשבר — מעדיפים fakes על פני mocks, מזריקים זמן ואקראיות, ונותנים ל-mutation testing להגיד אם הבדיקות באמת תופסות באגים."
  },
  analogy: {
    en: "Unit tests are a car's dashboard warning lights. A good light is specific ('left rear tyre pressure low'), not 'something is wrong'. It turns on only when there's a real problem — a light that flickers randomly (a flaky test) gets ignored, and then it's worse than no light. And you test each light in the factory with a fake sensor (a stub), not by actually driving into a nail. Mutation testing is the factory inspector who secretly punctures a tyre to check the light really comes on.",
    he: "Unit tests הם נורות האזהרה בלוח המחוונים של הרכב. נורה טובה ספציפית ('לחץ נמוך בצמיג אחורי שמאלי'), לא 'משהו לא בסדר'. היא נדלקת רק כשיש בעיה אמיתית — נורה שמהבהבת סתם (בדיקה flaky) מפסיקים לראות, ואז היא גרועה מכלום. ובודקים כל נורה במפעל עם חיישן מזויף (stub), לא ע\"י נסיעה על מסמר. Mutation testing זה המפקח במפעל שמפנצ'ר צמיג בסתר כדי לוודא שהנורה באמת נדלקת."
  },
  sections: [
    {
      h: { en: "One function, one behavior per test, names that read like a spec", he: "פונקציה אחת, התנהגות אחת לכל בדיקה, שמות שנקראים כמו מפרט" },
      body: {
        en: `<p>We'll test the same small domain everywhere: an <strong>order total with a coupon</strong> (SAVE10 = 10% off when the subtotal is ≥ 100) and later a <strong>checkout service</strong> with a repository, a clock and a mailer.</p>
<pre>${C.pyPricing}</pre>
<p>The shape of every good test is <strong>Arrange → Act → Assert</strong> (a.k.a. Given/When/Then). One <em>behavior</em> per test — not one assert: several asserts about the same outcome are fine. Name the test after the rule, so a failing name in CI is already the bug report: <code>test_save10_applies_at_exactly_100</code> beats <code>test_total_2</code>.</p>
<pre>${C.pyAAA}</pre>
<p>The parametrized table is where you spend your thinking: <strong>empty, one, many, boundary (exactly 100), just below (99.99), invalid input</strong>. Most real bugs live on boundaries, which is exactly what equivalence partitioning + boundary-value analysis is about.</p>
<blockquote>💡 Real world: Money is <code>Decimal</code>/<code>BigDecimal</code>/integer cents in tests too. A test that asserts <code>0.1 + 0.2 == 0.3</code> with floats is testing your CPU, not your code.</blockquote>`,
        he: `<p>נבדוק את אותו דומיין קטן בכל מקום: <strong>סכום הזמנה עם קופון</strong> (SAVE10 = 10% הנחה כשה-subtotal ≥ 100), ובהמשך <strong>שירות checkout</strong> עם repository, שעון ו-mailer.</p>
<pre>${C.pyPricing}</pre>
<p>הצורה של כל בדיקה טובה היא <strong>Arrange → Act → Assert</strong> (או Given/When/Then). <em>התנהגות</em> אחת לכל בדיקה — לא assert אחד: כמה asserts על אותה תוצאה זה בסדר. קוראים לבדיקה על שם הכלל, כך ששם שנכשל ב-CI הוא כבר דו"ח הבאג: <code>test_save10_applies_at_exactly_100</code> עדיף על <code>test_total_2</code>.</p>
<pre>${C.pyAAA}</pre>
<p>הטבלה המפורמטת היא המקום שבו משקיעים מחשבה: <strong>ריק, אחד, הרבה, גבול (בדיוק 100), ממש מתחת (99.99), קלט לא תקין</strong>. רוב הבאגים האמיתיים גרים על הגבולות — זה בדיוק equivalence partitioning ו-boundary-value analysis.</p>
<blockquote>💡 מהשטח: כסף הוא <code>Decimal</code>/<code>BigDecimal</code>/אגורות שלמות גם בבדיקות. בדיקה שמאמתת <code>0.1 + 0.2 == 0.3</code> ב-floats בודקת את המעבד, לא את הקוד שלך.</blockquote>`
      }
    },
    {
      h: { en: "The same tests in Jest, JUnit 5 and xUnit — plus test data builders", he: "אותן בדיקות ב-Jest, JUnit 5 ו-xUnit — ועוד test data builders" },
      body: {
        en: `<p>Every modern framework has the same three tools: a way to group tests, a <strong>table-driven</strong> form, and an exception assertion. Learn the idea once, map the syntax:</p>
<pre>${C.jest}</pre>
<pre>${C.junit}</pre>
<table><tr><th>Concept</th><th>pytest</th><th>Jest</th><th>JUnit 5</th><th>xUnit (C#)</th></tr>
<tr><td>Table-driven</td><td><code>@pytest.mark.parametrize</code></td><td><code>test.each</code></td><td><code>@ParameterizedTest</code></td><td><code>[Theory]</code> + <code>[InlineData]</code></td></tr>
<tr><td>Expect exception</td><td><code>pytest.raises</code></td><td><code>toThrow</code> / <code>rejects</code></td><td><code>assertThrows</code></td><td><code>Assert.Throws</code></td></tr>
<tr><td>Setup</td><td>fixtures</td><td><code>beforeEach</code></td><td><code>@BeforeEach</code></td><td>constructor</td></tr>
<tr><td>Parallel</td><td>pytest-xdist <code>-n auto</code></td><td>workers (default)</td><td><code>junit.jupiter.execution.parallel</code></td><td>collections</td></tr></table>
<p><strong>Test data builders</strong> keep tests short and intention-revealing: every field has a sensible default and the test overrides only what matters to <em>this</em> behavior. When the <code>Cart</code> constructor grows a new field, you fix one builder, not 300 tests.</p>
<pre>${C.builder}</pre>`,
        he: `<p>לכל framework מודרני יש אותם שלושה כלים: דרך לקבץ בדיקות, צורה <strong>table-driven</strong>, ו-assertion לחריגות. לומדים את הרעיון פעם אחת, וממפים את התחביר:</p>
<pre>${C.jest}</pre>
<pre>${C.junit}</pre>
<table><tr><th>מושג</th><th>pytest</th><th>Jest</th><th>JUnit 5</th><th>xUnit (C#)</th></tr>
<tr><td>Table-driven</td><td><code>@pytest.mark.parametrize</code></td><td><code>test.each</code></td><td><code>@ParameterizedTest</code></td><td><code>[Theory]</code> + <code>[InlineData]</code></td></tr>
<tr><td>ציפייה לחריגה</td><td><code>pytest.raises</code></td><td><code>toThrow</code> / <code>rejects</code></td><td><code>assertThrows</code></td><td><code>Assert.Throws</code></td></tr>
<tr><td>Setup</td><td>fixtures</td><td><code>beforeEach</code></td><td><code>@BeforeEach</code></td><td>constructor</td></tr>
<tr><td>מקבילות</td><td>pytest-xdist <code>-n auto</code></td><td>workers (ברירת מחדל)</td><td><code>junit.jupiter.execution.parallel</code></td><td>collections</td></tr></table>
<p><strong>Test data builders</strong> שומרים על בדיקות קצרות שמבהירות כוונה: לכל שדה יש ברירת מחדל הגיונית, והבדיקה דורסת רק את מה שחשוב להתנהגות <em>הזו</em>. כשה-constructor של <code>Cart</code> מקבל שדה חדש, מתקנים builder אחד, לא 300 בדיקות.</p>
<pre>${C.builder}</pre>`
      }
    },
    {
      h: { en: "The five test doubles — and when mocks hurt", he: "חמשת ה-test doubles — ומתי mocks מזיקים" },
      body: {
        en: `<p>Now a service with collaborators. The rule of thumb: <strong>real objects for values, fakes for infrastructure, mocks only for outgoing commands you must verify</strong>.</p>
<pre>${C.service}</pre>
<table><tr><th>Double</th><th>What it does</th><th>Use it for</th></tr>
<tr><td><strong>Dummy</strong></td><td>Passed but never used</td><td>Filling a parameter list</td></tr>
<tr><td><strong>Stub</strong></td><td>Returns canned answers</td><td>Inputs: a fixed clock, a config value</td></tr>
<tr><td><strong>Fake</strong></td><td>Working lightweight implementation</td><td>Repositories (in-memory), queues, file systems</td></tr>
<tr><td><strong>Spy</strong></td><td>Real-ish object that records calls</td><td>Checking an outgoing effect after the fact</td></tr>
<tr><td><strong>Mock</strong></td><td>Pre-programmed expectations, verified</td><td>Outgoing commands at a system boundary (charge card, send email)</td></tr></table>
<pre>${C.doubles}</pre>
<pre>${C.mock}</pre>
<p><strong>Over-specification</strong> is the #1 reason test suites become a tax: tests that assert <em>which internal method was called in what order</em> break on every refactor while still passing on real bugs. Assert on <strong>observable outcomes</strong> (return values, state of the fake, messages the spy received). Don't mock what you don't own — wrap the third-party SDK in your own small port and fake <em>that</em>.</p>
<blockquote>⚠️ Production tip: if a single test needs 5+ mocks, the test is telling you the class has too many responsibilities (see SOLID). Fix the design, not the test.</blockquote>`,
        he: `<p>עכשיו שירות עם שותפים. כלל אצבע: <strong>אובייקטים אמיתיים לערכים, fakes לתשתית, mocks רק לפקודות יוצאות שחייבים לאמת</strong>.</p>
<pre>${C.service}</pre>
<table><tr><th>Double</th><th>מה הוא עושה</th><th>משתמשים בו ל-</th></tr>
<tr><td><strong>Dummy</strong></td><td>מועבר אבל אף פעם לא בשימוש</td><td>מילוי רשימת פרמטרים</td></tr>
<tr><td><strong>Stub</strong></td><td>מחזיר תשובות קבועות מראש</td><td>קלטים: שעון קבוע, ערך config</td></tr>
<tr><td><strong>Fake</strong></td><td>מימוש קליל שעובד באמת</td><td>Repositories (בזיכרון), תורים, מערכות קבצים</td></tr>
<tr><td><strong>Spy</strong></td><td>אובייקט כמעט-אמיתי שמתעד קריאות</td><td>בדיקת השפעה יוצאת אחרי מעשה</td></tr>
<tr><td><strong>Mock</strong></td><td>ציפיות מתוכנתות מראש, מאומתות</td><td>פקודות יוצאות בגבול המערכת (חיוב כרטיס, שליחת מייל)</td></tr></table>
<pre>${C.doubles}</pre>
<pre>${C.mock}</pre>
<p><strong>Over-specification</strong> היא הסיבה מס' 1 שחבילות בדיקות הופכות למס: בדיקות שמאמתות <em>איזו מתודה פנימית נקראה ובאיזה סדר</em> נשברות בכל refactor, ועדיין עוברות על באגים אמיתיים. מאמתים <strong>תוצאות נצפות</strong> (ערכי החזרה, מצב ה-fake, ההודעות שה-spy קיבל). לא עושים mock למה שלא שלך — עוטפים את ה-SDK החיצוני ב-port קטן משלך ועושים fake <em>לו</em>.</p>
<blockquote>⚠️ טיפ לפרודקשן: אם בדיקה אחת צריכה 5+ mocks, הבדיקה אומרת לך שלמחלקה יש יותר מדי אחריות (ראה SOLID). מתקנים את התכנון, לא את הבדיקה.</blockquote>`
      }
    },
    {
      h: { en: "Time, randomness, async, exceptions — and property-based testing", he: "זמן, אקראיות, async, חריגות — ו-property-based testing" },
      body: {
        en: `<p>The four classic sources of flaky unit tests are all <strong>hidden inputs</strong>. Make them explicit: inject a <code>Clock</code>, inject an RNG with a seed, <code>await</code> async work instead of sleeping, and use fake timers for TTLs and retries.</p>
<pre>${C.asyncTime}</pre>
<p><strong>Property-based testing</strong> flips the approach: instead of choosing 5 examples, you state a <em>property</em> that must hold for all inputs, and the tool (Hypothesis, fast-check, jqwik, FsCheck) generates hundreds of cases, then <strong>shrinks</strong> a failure to the smallest counter-example. It shines for parsers, serializers (decode(encode(x)) == x), money math, sorting, idempotency (f(f(x)) == f(x)).</p>
<pre>${C.hypo}</pre>
<blockquote>💡 Real world: property tests regularly find bugs that 100% line coverage missed — empty lists, unicode, huge numbers, duplicates. Run them with a fixed seed in CI and a random one nightly; Hypothesis stores failing examples in <code>.hypothesis/</code> so they replay forever.</blockquote>`,
        he: `<p>ארבעת המקורות הקלאסיים ל-unit tests flaky הם כולם <strong>קלטים נסתרים</strong>. הופכים אותם למפורשים: מזריקים <code>Clock</code>, מזריקים RNG עם seed, עושים <code>await</code> לעבודה אסינכרונית במקום לישון, ומשתמשים ב-fake timers ל-TTLs ו-retries.</p>
<pre>${C.asyncTime}</pre>
<p><strong>Property-based testing</strong> הופך את הגישה: במקום לבחור 5 דוגמאות, מנסחים <em>תכונה</em> שחייבת להתקיים לכל קלט, והכלי (Hypothesis, fast-check, jqwik, FsCheck) מייצר מאות מקרים ואז <strong>מכווץ (shrink)</strong> כשל לדוגמה-נגדית הכי קטנה. זה מבריק ל-parsers, serializers (decode(encode(x)) == x), חישובי כסף, מיון ואידמפוטנטיות (f(f(x)) == f(x)).</p>
<pre>${C.hypo}</pre>
<blockquote>💡 מהשטח: בדיקות property מוצאות באופן קבוע באגים ש-100% line coverage פספס — רשימות ריקות, unicode, מספרים ענקיים, כפילויות. מריצים עם seed קבוע ב-CI ואקראי ב-nightly; Hypothesis שומר דוגמאות שנכשלו ב-<code>.hypothesis/</code> כדי שירוצו שוב לתמיד.</blockquote>`
      }
    },
    {
      h: { en: "TDD, mutation testing, F.I.R.S.T. — and what not to unit test", he: "TDD, mutation testing, F.I.R.S.T. — ומה לא לבדוק ב-unit" },
      body: {
        en: `<p><strong>TDD</strong> is a design loop, not a religion: write the next failing test, make it pass the simplest way, refactor while green. It forces small, testable units and gives you a regression net for free.</p>
<pre>${C.tdd}</pre>
<p><strong>Coverage tells you what ran, not what was checked.</strong> Mutation testing changes your code in tiny ways (<code>&gt;=</code> → <code>&gt;</code>, <code>+</code> → <code>-</code>, delete a call) and reruns the tests; a <em>surviving</em> mutant is a bug your tests would miss.</p>
<pre>${C.mut}</pre>
<p><strong>F.I.R.S.T.</strong>: <strong>F</strong>ast (the whole unit suite in &lt; 1–2 min; one test in ms), <strong>I</strong>ndependent (any order, any subset), <strong>R</strong>epeatable (same result on laptop and CI, no network/clock/random), <strong>S</strong>elf-validating (pass/fail, no reading logs), <strong>T</strong>imely (written with the code).</p>
<p><strong>Don't unit-test</strong>: framework glue and getters, private methods directly (test via the public API), the database or HTTP stack (that's integration testing), generated code, or implementation details likely to change. Do unit-test: business rules, edge cases, error paths, calculations, parsing, state machines.</p>
<blockquote>⚠️ Production tip: set a <em>mutation score</em> target on critical modules (pricing, auth, billing — say ≥ 80%) instead of a global coverage number. Global coverage targets invite assert-free tests.</blockquote>`,
        he: `<p><strong>TDD</strong> הוא לולאת תכנון, לא דת: כותבים את הבדיקה הנכשלת הבאה, גורמים לה לעבור בדרך הכי פשוטה, ועושים refactor כשהכול ירוק. זה מכריח יחידות קטנות שאפשר לבדוק, ונותן רשת regression בחינם.</p>
<pre>${C.tdd}</pre>
<p><strong>Coverage אומר מה רץ, לא מה נבדק.</strong> Mutation testing משנה את הקוד בשינויים זעירים (<code>&gt;=</code> → <code>&gt;</code>, <code>+</code> → <code>-</code>, מחיקת קריאה) ומריץ את הבדיקות שוב; mutant ש<em>שורד</em> הוא באג שהבדיקות שלך היו מפספסות.</p>
<pre>${C.mut}</pre>
<p><strong>F.I.R.S.T.</strong>: <strong>F</strong>ast (כל חבילת ה-unit ב-&lt; 1–2 דק'; בדיקה בודדת במילישניות), <strong>I</strong>ndependent (בכל סדר, בכל תת-קבוצה), <strong>R</strong>epeatable (אותה תוצאה בלפטופ וב-CI, בלי רשת/שעון/אקראיות), <strong>S</strong>elf-validating (עובר/נכשל, בלי לקרוא לוגים), <strong>T</strong>imely (נכתבות יחד עם הקוד).</p>
<p><strong>לא בודקים ב-unit</strong>: דבק של framework ו-getters, מתודות private ישירות (בודקים דרך ה-API הציבורי), את ה-DB או מחסנית ה-HTTP (זה integration), קוד מג'ונרט, או פרטי מימוש שעלולים להשתנות. כן בודקים: חוקים עסקיים, מקרי קצה, מסלולי שגיאה, חישובים, parsing ו-state machines.</p>
<blockquote>⚠️ טיפ לפרודקשן: הצב יעד <em>mutation score</em> למודולים קריטיים (pricing, auth, billing — נניח ≥ 80%) במקום מספר coverage גלובלי. יעדי coverage גלובליים מזמינים בדיקות בלי asserts.</blockquote>`
      }
    }
  ],
  diagram: `   TDD loop                     Where each double plugs in
  +--------+                    +------------------------+
  |  RED   | write failing      |   CheckoutService      |
  +---+----+ test               |  (real object, SUT)    |
      v                         +--+--------+--------+---+
  +--------+                       |        |        |
  | GREEN  | simplest code        repo    clock    mailer
  +---+----+ that passes          FAKE    STUB     SPY / MOCK
      v                        (in-mem)  (fixed)  (records /
  +----------+                                     verifies)
  | REFACTOR | keep green
  +----+-----+          Mutation testing:
       |                code --mutate--> tests run --> killed?
       +--> next test           (>= -> >)              survived = gap`,
  handsOn: [
    { cmd: "pytest -q -k order_total --durations=5", what: { en: "Run only the pricing tests and list the 5 slowest — any unit test above ~50 ms is hiding I/O or sleeps.", he: "מריצים רק את בדיקות התמחור ומציגים את 5 האיטיות — כל unit test מעל ~50ms מסתיר I/O או sleep." } },
    { cmd: "pytest -p no:randomly -x && pytest -p randomly --randomly-seed=1234", what: { en: "Run in fixed order, then in random order (pytest-randomly): if results differ, your tests share state.", he: "מריצים בסדר קבוע ואז בסדר אקראי (pytest-randomly): אם התוצאות שונות, יש לבדיקות state משותף." } },
    { cmd: "npx jest --coverage --coverageThreshold='{\"global\":{\"branches\":80}}'", what: { en: "Branch coverage (not just lines) with a threshold that fails the build.", he: "Branch coverage (לא רק שורות) עם סף שמכשיל את ה-build." } },
    { cmd: "mutmut run --paths-to-mutate pricing.py && mutmut results", what: { en: "Mutation-test one critical module and list surviving mutants.", he: "Mutation testing למודול קריטי אחד והצגת ה-mutants ששרדו." } },
    { cmd: "npx stryker run --mutate 'src/pricing/**/*.ts'", what: { en: "Same idea for TypeScript with Stryker; open reports/mutation/mutation.html.", he: "אותו רעיון ל-TypeScript עם Stryker; פותחים את reports/mutation/mutation.html." } }
  ],
  mnemonic: {
    en: "AAA + FIRST + 'fake it, don't mock it': Arrange-Act-Assert, Fast-Independent-Repeatable-Self-validating-Timely, and mock only what leaves the building.",
    he: "AAA + FIRST + 'תזייף, אל תעשה mock': Arrange-Act-Assert, Fast-Independent-Repeatable-Self-validating-Timely, ו-mock רק למה שיוצא מהבניין."
  },
  pitfalls: [
    { en: "Asserting on interactions instead of outcomes (verify(repo).save(...) everywhere). Every refactor turns the suite red while real bugs pass — tests become a tax and people stop trusting them.", he: "לאמת אינטראקציות במקום תוצאות (verify(repo).save(...) בכל מקום). כל refactor צובע את החבילה באדום בזמן שבאגים אמיתיים עוברים — הבדיקות הופכות למס ומפסיקים לסמוך עליהן." },
    { en: "Hidden inputs: datetime.now(), random(), env vars, the network. The test passes at 14:00 and fails at 23:59 or on the 29th of February. Inject them.", he: "קלטים נסתרים: datetime.now(), random(), משתני סביבה, רשת. הבדיקה עוברת ב-14:00 ונכשלת ב-23:59 או ב-29 בפברואר. מזריקים אותם." },
    { en: "Chasing a coverage percentage. 95% coverage with weak asserts catches less than 70% with sharp ones; use mutation score on the code that matters.", he: "לרדוף אחרי אחוז coverage. 95% coverage עם asserts חלשים תופס פחות מ-70% עם asserts חדים; משתמשים ב-mutation score על הקוד שחשוב." },
    { en: "Async tests that don't await (or return) the promise: the test finishes before the assertion runs and passes vacuously.", he: "בדיקות async שלא עושות await (או return) ל-promise: הבדיקה מסתיימת לפני שה-assertion רץ ועוברת סתם." }
  ],
  interview: [
    { q: { en: "Mock vs stub vs fake — which do you prefer and why?", he: "Mock מול stub מול fake — מה אתה מעדיף ולמה?" },
      a: { en: "Stubs for inputs (a fixed clock), fakes for infrastructure I own an interface for (an in-memory repository behaves like the real one, so tests assert on state and survive refactors), and mocks only for outgoing commands at a boundary that I must verify happened exactly once (charge card, send email). Heavy mocking couples tests to implementation; if I need many mocks the class probably has too many responsibilities. I never mock third-party types directly — I wrap them in a port and fake the port, and cover the real adapter with an integration test.", he: "Stubs לקלטים (שעון קבוע), fakes לתשתית שיש לי עליה interface (repository בזיכרון מתנהג כמו האמיתי, אז הבדיקות מאמתות state ושורדות refactors), ו-mocks רק לפקודות יוצאות בגבול שחייבים לאמת שקרו בדיוק פעם אחת (חיוב כרטיס, שליחת מייל). mocking כבד מצמיד בדיקות למימוש; אם צריך הרבה mocks, כנראה שלמחלקה יש יותר מדי אחריות. אף פעם לא עושה mock לטיפוסים של צד שלישי ישירות — עוטף אותם ב-port, עושה fake ל-port, ומכסה את ה-adapter האמיתי ב-integration test." } },
    { q: { en: "Your team has 90% coverage but bugs still escape. What do you do?", he: "לצוות יש 90% coverage ועדיין באגים בורחים. מה עושים?" },
      a: { en: "Coverage measures execution, not verification. I'd run mutation testing on the modules where the escaped bugs lived to find surviving mutants, add boundary and property-based tests there, review recent incidents to see which test layer should have caught each one (often integration/contract, not unit), and replace the global coverage gate with a coverage-delta gate plus mutation-score targets on critical code.", he: "Coverage מודד הרצה, לא אימות. הייתי מריץ mutation testing על המודולים שבהם הבאגים ברחו כדי למצוא mutants ששורדים, מוסיף שם בדיקות גבול ו-property-based, עובר על התקלות האחרונות לראות איזו שכבת בדיקות הייתה אמורה לתפוס כל אחת (לרוב integration/contract, לא unit), ומחליף את שער ה-coverage הגלובלי בשער coverage-delta ויעדי mutation score לקוד קריטי." } },
    { q: { en: "How do you unit-test code that depends on the current time?", he: "איך בודקים ב-unit קוד שתלוי בשעה הנוכחית?" },
      a: { en: "Make time an explicit dependency: inject a Clock (java.time.Clock, a callable in Python, a now() function in JS) and use a fixed clock in tests; for timers use fake timers (jest.useFakeTimers, freezegun/time-machine). Then test boundaries explicitly: exactly at expiry, one millisecond after, DST transitions, end of month, leap day.", he: "הופכים את הזמן לתלות מפורשת: מזריקים Clock (java.time.Clock, callable ב-Python, פונקציית now() ב-JS) ומשתמשים בשעון קבוע בבדיקות; לטיימרים — fake timers (jest.useFakeTimers, freezegun/time-machine). ואז בודקים גבולות במפורש: בדיוק ברגע התפוגה, מילישנייה אחרי, מעברי שעון קיץ, סוף חודש, 29 בפברואר." } }
  ],
  quiz: [
    { q: { en: "Your tests have 100% line coverage of order_total, yet a mutant changing '>= 100' to '> 100' survives. What is missing?", he: "יש 100% line coverage ל-order_total, ועדיין mutant שמשנה '>= 100' ל-'> 100' שורד. מה חסר?" },
      options: [ { en: "More mocks", he: "עוד mocks" }, { en: "A test at exactly the boundary (subtotal = 100.00)", he: "בדיקה בדיוק על הגבול (subtotal = 100.00)" }, { en: "Branch coverage reporting", he: "דיווח branch coverage" }, { en: "Running the tests in parallel", he: "להריץ את הבדיקות במקביל" } ],
      answer: 1, explain: { en: "Both conditions behave the same for every input you tested except exactly 100. The boundary case kills the mutant.", he: "שני התנאים מתנהגים אותו דבר לכל קלט שנבדק חוץ מבדיוק 100. מקרה הגבול הורג את ה-mutant." } },
    { q: { en: "Which double is an in-memory repository that really stores and returns objects?", he: "איזה double הוא repository בזיכרון שבאמת שומר ומחזיר אובייקטים?" },
      options: [ { en: "Dummy", he: "Dummy" }, { en: "Stub", he: "Stub" }, { en: "Fake", he: "Fake" }, { en: "Mock", he: "Mock" } ],
      answer: 2, explain: { en: "A fake is a working, simplified implementation. Stubs only return canned answers; mocks verify expected calls.", he: "Fake הוא מימוש עובד ומפושט. Stubs רק מחזירים תשובות קבועות; mocks מאמתים קריאות צפויות." } },
    { q: { en: "A test passes locally but fails in CI only around midnight UTC. Most likely cause?", he: "בדיקה עוברת מקומית ונכשלת ב-CI רק סביב חצות UTC. הסיבה הכי סבירה?" },
      options: [ { en: "CI machines are slower", he: "המכונות של ה-CI איטיות יותר" }, { en: "A hidden dependency on the real clock / time zone", he: "תלות נסתרת בשעון האמיתי / אזור זמן" }, { en: "Too many asserts in one test", he: "יותר מדי asserts בבדיקה אחת" }, { en: "Missing test data builder", he: "חסר test data builder" } ],
      answer: 1, explain: { en: "Date-boundary failures are the signature of now() and local time zones leaking into the code. Inject a clock and pin the time zone.", he: "כשלים על גבול יום הם החתימה של now() ואזור זמן מקומי שדולפים לקוד. מזריקים שעון ומקבעים אזור זמן." } },
    { q: { en: "What does property-based testing add over example-based tests?", he: "מה property-based testing מוסיף על פני בדיקות מבוססות דוגמאות?" },
      options: [ { en: "It replaces the need for assertions", he: "הוא מייתר את הצורך ב-assertions" }, { en: "It generates many inputs for a stated invariant and shrinks failures to a minimal counter-example", he: "הוא מייצר הרבה קלטים לאינווריאנט מוגדר ומכווץ כשלים לדוגמה-נגדית מינימלית" }, { en: "It runs tests against production", he: "הוא מריץ בדיקות מול פרודקשן" }, { en: "It measures line coverage more precisely", he: "הוא מודד line coverage בדיוק רב יותר" } ],
      answer: 1, explain: { en: "You describe a rule that must always hold; the tool hunts for inputs that break it and minimizes them.", he: "מתארים כלל שחייב תמיד להתקיים; הכלי מחפש קלטים ששוברים אותו וממזער אותם." } }
  ],
  related: ["pr-test-strategy", "pr-integration-testing", "pr-solid", "pr-design-patterns", "pr-time-timestamps", "pr-code-review-quality"]
});

INFRA.lessons.push({
  id: "pr-integration-testing",
  track: "principal",
  order: 101,
  icon: "🔌",
  level: 3,
  minutes: 18,
  title: { en: "Integration, Contract & E2E Testing: Testcontainers, Pact, Playwright", he: "בדיקות Integration, Contract ו-E2E: Testcontainers, Pact, Playwright" },
  tldr: {
    en: "Unit tests prove your logic; integration tests prove your code talks correctly to the real database, broker and HTTP stack (Testcontainers), contract tests prove two services agree without deploying both (Pact), and a thin layer of e2e tests (Playwright) proves the user journey works — all fast and parallel enough to run on every PR.",
    he: "Unit tests מוכיחים את הלוגיקה; integration tests מוכיחים שהקוד מדבר נכון עם ה-DB, ה-broker ומחסנית ה-HTTP האמיתיים (Testcontainers); contract tests מוכיחים ששני שירותים מסכימים בלי לפרוס את שניהם (Pact); ושכבה דקה של e2e (Playwright) מוכיחה שמסע המשתמש עובד — והכול מהיר ומקבילי מספיק כדי לרוץ על כל PR."
  },
  analogy: {
    en: "Building a car: unit tests check each part on the bench. Integration tests bolt the engine to the real gearbox and run it on a stand — no road, but real metal. Contract tests are the interface spec between the engine supplier and the gearbox supplier: each factory tests against the shared spec so they never have to ship parts to each other to find out the bolts don't line up. E2E tests are the test driver taking one full lap of the track — expensive, so you do a few laps, not a thousand.",
    he: "בונים מכונית: unit tests בודקים כל חלק על שולחן העבודה. Integration tests מבריגים את המנוע לתיבת ההילוכים האמיתית ומריצים על מתקן — בלי כביש, אבל מתכת אמיתית. Contract tests הם מפרט הממשק בין ספק המנוע לספק תיבת ההילוכים: כל מפעל בודק מול המפרט המשותף, כך שלא צריך לשלוח חלקים אחד לשני כדי לגלות שהברגים לא מתיישרים. E2E זה נהג המבחן שעושה הקפה מלאה במסלול — יקר, אז עושים כמה הקפות, לא אלף."
  },
  sections: [
    {
      h: { en: "Real dependencies in a container: Testcontainers", he: "תלויות אמיתיות בקונטיינר: Testcontainers" },
      body: {
        en: `<p>Integration tests catch what unit tests can't: wrong SQL, a missing index or constraint, migrations that don't apply, JSON (de)serialization, transaction boundaries, driver/timeout config. Use the <strong>same engine and version as production</strong> — an H2 or SQLite stand-in for Postgres hides exactly the bugs you're looking for (JSONB, <code>ON CONFLICT</code>, locking).</p>
<p><strong>Testcontainers</strong> (Java, Go, .NET, Python, Node) starts throwaway Docker containers from the test, waits until they're ready, and gives you the mapped port. A Postgres container starts in ~2–4 s; share one per test class or per suite and isolate tests with transactions or truncation.</p>
<pre>${C.tcJava}</pre>
<pre>${C.tcPy}</pre>
<blockquote>💡 Real world: test the migration path, not just the end state — apply <code>head</code> on an empty DB, and in a nightly job apply the new migration on a <em>restored anonymized snapshot</em> of production. That's where "ALTER TABLE takes a 40-minute lock" is discovered before it's an incident.</blockquote>`,
        he: `<p>Integration tests תופסים את מה ש-unit לא יכול: SQL שגוי, index או constraint חסרים, מיגרציות שלא עולות, (de)serialization של JSON, גבולות טרנזקציה, והגדרות driver/timeout. משתמשים <strong>באותו מנוע ובאותה גרסה כמו בפרודקשן</strong> — H2 או SQLite במקום Postgres מסתירים בדיוק את הבאגים שמחפשים (JSONB, <code>ON CONFLICT</code>, נעילות).</p>
<p><strong>Testcontainers</strong> (Java, Go, .NET, Python, Node) מרים קונטיינרי Docker חד-פעמיים מתוך הבדיקה, מחכה שיהיו מוכנים, ונותן את הפורט הממופה. קונטיינר Postgres עולה ב-~2–4 שניות; משתפים אחד לכל מחלקת בדיקות או לכל ה-suite, ומבודדים בדיקות עם טרנזקציות או truncate.</p>
<pre>${C.tcJava}</pre>
<pre>${C.tcPy}</pre>
<blockquote>💡 מהשטח: בודקים את מסלול המיגרציה, לא רק את המצב הסופי — מריצים <code>head</code> על DB ריק, וב-job לילי מריצים את המיגרציה החדשה על <em>snapshot משוחזר ומותמם</em> של פרודקשן. שם מגלים ש-"ALTER TABLE לוקח נעילה של 40 דקות" לפני שזה הופך לתקלה.</blockquote>`
      }
    },
    {
      h: { en: "Consumer-driven contract tests with Pact", he: "Consumer-driven contract tests עם Pact" },
      body: {
        en: `<p>With 30 microservices you can't spin all of them up to test one change — the shared "integration environment" becomes slow, flaky and always broken. <strong>Contract tests</strong> replace it: the <em>consumer</em> records the exact requests it makes and the response fields it relies on; the <em>provider</em> replays those contracts against its real code in its own CI.</p>
<pre>${C.pact}</pre>
<pre>${C.pactFlow}</pre>
<p>Why it works: the provider learns exactly which fields are used (so it can safely remove unused ones), the consumer can't silently depend on something the provider never promised, and <code>can-i-deploy</code> checks the <em>matrix</em> of versions actually in each environment before release. Use matchers (<code>like</code>, <code>eachLike</code>, regex) so contracts check shape, not exact data; use provider <em>states</em> ("order o-81 exists") for setup.</p>
<blockquote>⚠️ Production tip: contracts are not a substitute for API versioning discipline — they're the safety net that tells you, before merging, that a "harmless" rename breaks the mobile app still running v4.2 on a million phones.</blockquote>`,
        he: `<p>עם 30 microservices אי אפשר להרים את כולם כדי לבדוק שינוי אחד — "סביבת ה-integration" המשותפת הופכת לאיטית, flaky ותמיד שבורה. <strong>Contract tests</strong> מחליפים אותה: ה-<em>consumer</em> מתעד בדיוק אילו בקשות הוא שולח ועל אילו שדות בתגובה הוא נשען; ה-<em>provider</em> מריץ את החוזים האלה מול הקוד האמיתי שלו ב-CI שלו.</p>
<pre>${C.pact}</pre>
<pre>${C.pactFlow}</pre>
<p>למה זה עובד: ה-provider יודע בדיוק באילו שדות משתמשים (אז אפשר להסיר בבטחה את מה שלא), ה-consumer לא יכול להישען בשקט על משהו שה-provider מעולם לא הבטיח, ו-<code>can-i-deploy</code> בודק את <em>מטריצת</em> הגרסאות שבאמת רצות בכל סביבה לפני release. משתמשים ב-matchers (<code>like</code>, <code>eachLike</code>, regex) כדי שהחוזים יבדקו צורה ולא דאטה מדויק; ו-provider <em>states</em> ("order o-81 exists") ל-setup.</p>
<blockquote>⚠️ טיפ לפרודקשן: חוזים לא מחליפים משמעת של API versioning — הם רשת הביטחון שאומרת לך, לפני merge, ש-rename "תמים" שובר את אפליקציית המובייל שעדיין רצה בגרסה 4.2 על מיליון טלפונים.</blockquote>`
      }
    },
    {
      h: { en: "Testing async consumers and queues", he: "בדיקת consumers אסינכרוניים ותורים" },
      body: {
        en: `<p>Event-driven code breaks the "call → assert" rhythm: you publish a message and the effect happens <em>later</em>, on another thread or service. The two bad answers are <code>sleep(5)</code> (slow and still flaky) and not testing it at all. The good answer is <strong>"eventually" assertions</strong>: poll a condition with a timeout.</p>
<pre>${C.await}</pre>
<p>What to cover for a consumer: happy path; <strong>duplicate delivery</strong> (send the same message twice — the effect must happen once, see idempotency); poison message goes to the DLQ after N attempts; out-of-order events; consumer restart mid-batch (offset commit after processing). Run a real broker in Testcontainers (Kafka, RabbitMQ, LocalStack for SQS) — in-memory brokers skip the rebalance, ack and serialization behavior you actually need to test.</p>
<blockquote>💡 Real world: give every test its own topic/queue name (suffix with a UUID) so parallel tests don't consume each other's messages — the #1 cause of flaky Kafka tests.</blockquote>`,
        he: `<p>קוד event-driven שובר את קצב ה-"קריאה → assert": מפרסמים הודעה, וההשפעה קורית <em>אחר כך</em>, ב-thread או בשירות אחר. שתי התשובות הרעות הן <code>sleep(5)</code> (איטי ועדיין flaky) ולא לבדוק בכלל. התשובה הטובה היא <strong>assertions מסוג "eventually"</strong>: polling על תנאי עם timeout.</p>
<pre>${C.await}</pre>
<p>מה לכסות ב-consumer: המסלול השמח; <strong>מסירה כפולה</strong> (שולחים את אותה הודעה פעמיים — ההשפעה חייבת לקרות פעם אחת, ראה אידמפוטנטיות); poison message הולכת ל-DLQ אחרי N ניסיונות; events לא לפי הסדר; restart של ה-consumer באמצע batch (commit של ה-offset אחרי העיבוד). מריצים broker אמיתי ב-Testcontainers (Kafka, RabbitMQ, LocalStack ל-SQS) — brokers בזיכרון מדלגים בדיוק על התנהגות ה-rebalance, ה-ack וה-serialization שצריך לבדוק.</p>
<blockquote>💡 מהשטח: תן לכל בדיקה topic/queue משלה (עם סיומת UUID) כדי שבדיקות מקביליות לא יצרכו הודעות אחת של השנייה — הסיבה מס' 1 לבדיקות Kafka flaky.</blockquote>`
      }
    },
    {
      h: { en: "E2E with Playwright and ephemeral preview environments", he: "E2E עם Playwright וסביבות preview זמניות" },
      body: {
        en: `<p>Keep e2e tests <strong>few and valuable</strong>: the 5–20 journeys that make money or would make the news (sign up, log in, checkout, password reset). Use user-facing locators (<code>getByRole</code>, <code>getByLabel</code>) — they survive CSS refactors and double as an accessibility check. Playwright auto-waits for elements, so explicit sleeps are a smell.</p>
<pre>${C.pw}</pre>
<p><strong>Page objects</strong> (a <code>CheckoutPage</code> class with <code>addToCart()</code>, <code>pay(card)</code>) keep selectors in one place. <strong>Traces</strong> (<code>trace: "on-first-retry"</code>) record DOM snapshots, network and console for every step — open them with <code>npx playwright show-trace</code> instead of guessing why CI failed.</p>
<p><strong>Ephemeral preview environments</strong>: every PR gets its own namespace (<code>pr-1234</code>) via Helm or an Argo CD ApplicationSet PR generator, with seeded test data and a URL; e2e runs against it and it's destroyed on merge. Test data: create what each test needs through the API (fast, isolated), use factories, never depend on "the user Dana that exists in staging".</p>`,
        he: `<p>שומרים על e2e <strong>מעטים ושווים</strong>: 5–20 המסעות שמכניסים כסף או שהיו מגיעים לחדשות (הרשמה, התחברות, checkout, איפוס סיסמה). משתמשים ב-locators מכווני משתמש (<code>getByRole</code>, <code>getByLabel</code>) — הם שורדים refactor של CSS ומשמשים גם בדיקת נגישות. Playwright מחכה אוטומטית לאלמנטים, אז sleep מפורש הוא סימן רע.</p>
<pre>${C.pw}</pre>
<p><strong>Page objects</strong> (מחלקת <code>CheckoutPage</code> עם <code>addToCart()</code>, <code>pay(card)</code>) שומרים את ה-selectors במקום אחד. <strong>Traces</strong> (<code>trace: "on-first-retry"</code>) מקליטים snapshots של ה-DOM, רשת ו-console לכל צעד — פותחים עם <code>npx playwright show-trace</code> במקום לנחש למה ה-CI נכשל.</p>
<p><strong>סביבות preview זמניות</strong>: כל PR מקבל namespace משלו (<code>pr-1234</code>) דרך Helm או PR generator של Argo CD ApplicationSet, עם דאטה בדיקה מוזרע ו-URL; ה-e2e רץ מולו והוא נמחק ב-merge. דאטה לבדיקות: יוצרים את מה שכל בדיקה צריכה דרך ה-API (מהיר, מבודד), משתמשים ב-factories, ואף פעם לא תלויים ב-"המשתמשת דנה שקיימת ב-staging".</p>`
      }
    },
    {
      h: { en: "Flaky tests and a CI pipeline that stays fast", he: "בדיקות flaky ו-pipeline של CI שנשאר מהיר" },
      body: {
        en: `<p>A flaky test is worse than no test: it trains everyone to click "re-run". Treat flakiness as a bug with an owner.</p>
<table><tr><th>Root cause</th><th>Symptom</th><th>Fix</th></tr>
<tr><td>Fixed sleeps / races</td><td>Fails under load</td><td>Eventually-assertions, auto-waiting locators</td></tr>
<tr><td>Shared state / order dependence</td><td>Fails only with other tests</td><td>Per-test data, unique names, random order runs</td></tr>
<tr><td>Real time / time zone</td><td>Fails at midnight, month end</td><td>Injected clock, pinned TZ</td></tr>
<tr><td>Network / third parties</td><td>Fails when sandbox is slow</td><td>Fakes/WireMock; contract tests for the real API</td></tr>
<tr><td>Resource limits</td><td>Fails only in CI</td><td>Right-size runners, fewer parallel containers</td></tr></table>
<p><strong>Policy</strong>: auto-detect (a test that fails then passes on retry is <em>flaky</em>, report it), quarantine with a ticket and owner within a day, fix or delete within two weeks. Retries are a reporting tool, not a fix.</p>
<pre>${C.ci}</pre>
<blockquote>⚠️ Production tip: a PR pipeline over ~15 minutes changes behavior — people batch changes and skip running tests. Shard, cache dependencies and Docker layers, run only affected modules (Nx/Bazel/Gradle), and push slow suites to nightly.</blockquote>`,
        he: `<p>בדיקה flaky גרועה מאין בדיקה: היא מאמנת את כולם ללחוץ "re-run". מתייחסים ל-flakiness כמו לבאג עם בעלים.</p>
<table><tr><th>סיבת שורש</th><th>סימפטום</th><th>תיקון</th></tr>
<tr><td>sleep קבוע / races</td><td>נכשל תחת עומס</td><td>Eventually-assertions, locators שמחכים אוטומטית</td></tr>
<tr><td>State משותף / תלות בסדר</td><td>נכשל רק יחד עם בדיקות אחרות</td><td>דאטה לכל בדיקה, שמות ייחודיים, הרצות בסדר אקראי</td></tr>
<tr><td>זמן אמיתי / אזור זמן</td><td>נכשל בחצות, בסוף חודש</td><td>שעון מוזרק, TZ מקובע</td></tr>
<tr><td>רשת / צדדים שלישיים</td><td>נכשל כשה-sandbox איטי</td><td>Fakes/WireMock; contract tests ל-API האמיתי</td></tr>
<tr><td>מגבלות משאבים</td><td>נכשל רק ב-CI</td><td>Runners בגודל נכון, פחות קונטיינרים במקביל</td></tr></table>
<p><strong>מדיניות</strong>: זיהוי אוטומטי (בדיקה שנכשלת ואז עוברת ב-retry היא <em>flaky</em> — מדווחים), quarantine עם טיקט ובעלים תוך יום, תיקון או מחיקה תוך שבועיים. Retries הם כלי דיווח, לא תיקון.</p>
<pre>${C.ci}</pre>
<blockquote>⚠️ טיפ לפרודקשן: pipeline של PR מעל ~15 דקות משנה התנהגות — אנשים מאגדים שינויים ומדלגים על הרצת בדיקות. עושים sharding, cache לתלויות ולשכבות Docker, מריצים רק מודולים מושפעים (Nx/Bazel/Gradle), ודוחפים suites איטיים ל-nightly.</blockquote>`
      }
    }
  ],
  diagram: `          fast, many                               slow, few
  unit ---------> integration ---------> contract ---------> e2e
  (ms, logic)     (real PG/Kafka in      (consumer pact      (Playwright vs
                   Testcontainers)        vs provider CI)     preview env)

  consumer CI                 Pact Broker              provider CI
  +-----------+  publish   +--------------+  fetch   +---------------+
  | web tests |----------->| web->orders  |--------->| verify vs     |
  | (mock API)|  pact.json | contracts +  |<---------| real handlers |
  +-----------+            | verif. matrix| results  +---------------+
        |                  +------+-------+
        +--- can-i-deploy? -------+--> yes: deploy  / no: block`,
  handsOn: [
    { cmd: "docker run --rm -d -p 5433:5432 -e POSTGRES_PASSWORD=pw postgres:16-alpine && pytest -m integration", what: { en: "What Testcontainers automates: a real, disposable Postgres matching prod's version for integration tests.", he: "מה ש-Testcontainers עושה אוטומטית: Postgres אמיתי וחד-פעמי בגרסה של פרודקשן ל-integration tests." } },
    { cmd: "npx playwright test --shard=1/4 --trace=on-first-retry", what: { en: "Run a quarter of the e2e suite (CI runs 4 shards in parallel) and record traces only for retried tests.", he: "מריצים רבע מחבילת ה-e2e (ה-CI מריץ 4 shards במקביל) ומקליטים traces רק לבדיקות שנוסו שוב." } },
    { cmd: "npx playwright show-trace test-results/checkout-chromium/trace.zip", what: { en: "Step through a failed run: DOM snapshot, network calls and console for every action.", he: "עוברים צעד-צעד על ריצה שנכשלה: snapshot של ה-DOM, קריאות רשת ו-console לכל פעולה." } },
    { cmd: "pact-broker can-i-deploy --pacticipant web --version $(git rev-parse --short HEAD) --to-environment production", what: { en: "Ask the broker whether this consumer version is compatible with what's deployed in production.", he: "שואלים את ה-broker אם גרסת ה-consumer הזו תואמת למה שרץ בפרודקשן." } },
    { cmd: "pytest -n auto -p randomly --count=20 tests/test_flaky_candidate.py", what: { en: "Hunt a flaky test: run it 20 times (pytest-repeat) in parallel and random order.", he: "צדים בדיקה flaky: מריצים אותה 20 פעם (pytest-repeat) במקביל ובסדר אקראי." } }
  ],
  mnemonic: {
    en: "Real engine, shared spec, one lap: Testcontainers for real dependencies, Pact for the spec between teams, Playwright for a few laps of the user journey.",
    he: "מנוע אמיתי, מפרט משותף, הקפה אחת: Testcontainers לתלויות אמיתיות, Pact למפרט בין צוותים, Playwright לכמה הקפות של מסע המשתמש."
  },
  pitfalls: [
    { en: "Testing against H2/SQLite or an in-memory broker 'because it's faster'. You test a different engine and miss exactly the locking, JSONB and rebalance bugs that hit production.", he: "לבדוק מול H2/SQLite או broker בזיכרון 'כי זה מהיר'. בודקים מנוע אחר ומפספסים בדיוק את באגי הנעילה, JSONB וה-rebalance שפוגעים בפרודקשן." },
    { en: "A shared long-lived staging environment as the only integration gate. It's always half broken, tests depend on each other's data, and nobody owns it — replace most of it with contract tests and ephemeral environments.", he: "סביבת staging משותפת וארוכת-חיים כשער integration יחיד. היא תמיד חצי שבורה, בדיקות תלויות בדאטה אחת של השנייה, ואין לה בעלים — מחליפים את רובה ב-contract tests ובסביבות זמניות." },
    { en: "Hundreds of e2e tests. They're slow, flaky and expensive to maintain; push coverage down to unit/integration and keep e2e for critical journeys.", he: "מאות בדיקות e2e. הן איטיות, flaky ויקרות לתחזוקה; מורידים את הכיסוי ל-unit/integration ומשאירים e2e למסעות קריטיים." },
    { en: "'Fixing' flakiness with automatic retries and moving on. The bug (often a real race in the product) stays, and the suite's signal degrades.", he: "'לתקן' flakiness עם retries אוטומטיים ולהמשיך הלאה. הבאג (לרוב race אמיתי במוצר) נשאר, והאות של החבילה נשחק." }
  ],
  interview: [
    { q: { en: "How would you test a change across 30 microservices without a giant shared staging environment?", he: "איך הייתם בודקים שינוי על פני 30 microservices בלי סביבת staging משותפת ענקית?" },
      a: { en: "Each service: unit + integration tests with real dependencies in Testcontainers. Between services: consumer-driven contracts (Pact) published to a broker, verified in provider CI, with can-i-deploy gating every release against the versions actually in each environment. Per-PR ephemeral environments with only the changed service plus stubs or shared dependencies for a few e2e smoke journeys. Then progressive delivery (canary + SLO-based rollback) as the final test in production.", he: "בכל שירות: unit + integration עם תלויות אמיתיות ב-Testcontainers. בין שירותים: consumer-driven contracts (Pact) שמתפרסמים ל-broker, מאומתים ב-CI של ה-provider, ו-can-i-deploy חוסם כל release מול הגרסאות שבאמת רצות בכל סביבה. סביבות זמניות לכל PR רק עם השירות שהשתנה + stubs או תלויות משותפות לכמה מסעות e2e smoke. ואז progressive delivery (canary + rollback לפי SLO) כבדיקה האחרונה בפרודקשן." } },
    { q: { en: "How do you test a Kafka consumer reliably?", he: "איך בודקים Kafka consumer בצורה אמינה?" },
      a: { en: "Real Kafka in Testcontainers, a unique topic per test, publish then assert with eventually (Awaitility / a polling helper), never sleep. Cover duplicates (effect happens once), poison messages to DLQ, ordering per key, and restart mid-batch to verify offsets are committed only after processing.", he: "Kafka אמיתי ב-Testcontainers, topic ייחודי לכל בדיקה, מפרסמים ואז מאמתים עם eventually (Awaitility / helper של polling), אף פעם לא sleep. מכסים כפילויות (ההשפעה קורית פעם אחת), poison messages ל-DLQ, סדר לפי key, ו-restart באמצע batch כדי לוודא שה-offset נשמר רק אחרי העיבוד." } }
  ],
  quiz: [
    { q: { en: "What problem do consumer-driven contract tests solve best?", he: "איזו בעיה contract tests מסוג consumer-driven פותרים הכי טוב?" },
      options: [ { en: "Finding SQL bugs", he: "מציאת באגים ב-SQL" }, { en: "Catching breaking API changes between services without deploying them together", he: "תפיסת שינויי API שוברים בין שירותים בלי לפרוס אותם יחד" }, { en: "Measuring latency", he: "מדידת latency" }, { en: "UI regressions", he: "רגרסיות UI" } ],
      answer: 1, explain: { en: "Each side tests against the shared, recorded contract in its own CI; can-i-deploy checks version compatibility.", he: "כל צד בודק מול החוזה המשותף המתועד ב-CI שלו; can-i-deploy בודק תאימות גרסאות." } },
    { q: { en: "Why prefer a real Postgres container over H2 for repository tests?", he: "למה להעדיף קונטיינר Postgres אמיתי על פני H2 לבדיקות repository?" },
      options: [ { en: "H2 is not open source", he: "H2 לא קוד פתוח" }, { en: "Engine-specific behavior (JSONB, ON CONFLICT, locks, migrations) only shows up on the real engine", he: "התנהגות ספציפית למנוע (JSONB, ON CONFLICT, נעילות, מיגרציות) מופיעה רק במנוע האמיתי" }, { en: "Containers are faster than in-memory DBs", he: "קונטיינרים מהירים יותר מ-DB בזיכרון" }, { en: "Testcontainers removes the need for unit tests", he: "Testcontainers מייתר unit tests" } ],
      answer: 1, explain: { en: "You want to test what production runs. A different engine hides the bugs integration tests exist to find.", he: "רוצים לבדוק את מה שרץ בפרודקשן. מנוע אחר מסתיר את הבאגים ש-integration tests נועדו למצוא." } },
    { q: { en: "The right way to assert on an async consumer's side effect is…", he: "הדרך הנכונה לאמת side effect של consumer אסינכרוני היא…" },
      options: [ { en: "Thread.sleep(5000) then assert", he: "Thread.sleep(5000) ואז assert" }, { en: "Poll the condition with a timeout (eventually-assertion)", he: "Polling על התנאי עם timeout (eventually-assertion)" }, { en: "Assert immediately after publishing", he: "Assert מיד אחרי הפרסום" }, { en: "Skip it; it's covered by e2e", he: "לדלג; e2e מכסה את זה" } ],
      answer: 1, explain: { en: "Polling returns as soon as the condition holds (fast) and still tolerates slow runs up to the timeout (stable).", he: "Polling חוזר ברגע שהתנאי מתקיים (מהיר) ועדיין סובל ריצות איטיות עד ה-timeout (יציב)." } },
    { q: { en: "A test fails, passes on retry, and the team enables 3 automatic retries. What's wrong?", he: "בדיקה נכשלת, עוברת ב-retry, והצוות מפעיל 3 retries אוטומטיים. מה הבעיה?" },
      options: [ { en: "Nothing, retries fix flakiness", he: "כלום, retries מתקנים flakiness" }, { en: "The root cause (possibly a real race) is hidden; retries should flag it as flaky and route it to an owner", he: "סיבת השורש (אולי race אמיתי) מוסתרת; retries צריכים לסמן אותה כ-flaky ולנתב לבעלים" }, { en: "3 retries is too few", he: "3 retries זה מעט מדי" }, { en: "Retries make the pipeline faster", he: "Retries מאיצים את ה-pipeline" } ],
      answer: 1, explain: { en: "Use retries to detect and report flakiness, then quarantine and fix it; never as the fix.", he: "משתמשים ב-retries כדי לזהות ולדווח flakiness, ואז quarantine ותיקון; אף פעם לא כתיקון." } }
  ],
  related: ["pr-test-strategy", "pr-unit-testing-craft", "pr-integration-styles", "pr-queue-kinds", "pr-idempotency", "flow-commit-to-prod", "rel-deployments", "pr-performance-testing"]
});

const P = {
kinds: `type        shape (RPS over time)       question it answers       length
load        ____/‾‾‾‾‾‾‾‾\\____        holds expected peak?      20-60 min
stress      ___/‾‾/‾‾/‾‾/‾‾\\          where does it break,      until fail
                                       how does it fail?
soak        __/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\\      leaks, slow growth,       4-24 h
                                       log/disk fill?
spike       ___|‾‾|____|‾‾|___         survive 10x in 10 s?      10-20 min
                                       autoscaling lag?
breakpoint  __/ / / / / / /            max sustainable RPS       ramp to fail`,
k6: `// load.js — open model: arrivals keep coming even if we slow down
import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    peak: {
      executor: "ramping-arrival-rate",
      startRate: 50, timeUnit: "1s",
      preAllocatedVUs: 200, maxVUs: 2000,
      stages: [
        { target: 500, duration: "5m" },   // ramp to peak
        { target: 500, duration: "20m" },  // hold
        { target: 0, duration: "2m" },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate&lt;0.001"],                // &lt; 0.1%
    http_req_duration: ["p(95)&lt;250", "p(99)&lt;600"],  // ms
  },
};

export default function () {
  const r = http.get(__ENV.BASE + "/api/orders?limit=20", {
    tags: { endpoint: "list_orders" },
  });
  check(r, { "status 200": (x) =&gt; x.status === 200 });
}`,
k6out: `$ k6 run -e BASE=https://staging.shop.internal load.js
  http_req_duration.....: avg=88ms  p(50)=61ms  p(95)=212ms
                          p(99)=540ms max=3.1s
  http_req_failed.......: 0.04%   ✓ 412  ✗ 1031288
  http_reqs.............: 1031700 487.3/s
  dropped_iterations....: 0
  ✓ http_req_duration p(95)&lt;250   ✓ p(99)&lt;600   ✓ failed&lt;0.1%`,
prof: `# Python: sample a running process, no restart needed
$ py-spy record -o flame.svg --pid 4121 --duration 30

# JVM: async-profiler (CPU, or -e alloc / -e lock)
$ asprof -d 30 -e cpu -f flame.html 4121

# Go: built-in pprof endpoint
$ go tool pprof -http=:8081 \\
    "http://localhost:6060/debug/pprof/profile?seconds=30"

# Node.js
$ npx clinic flame -- node server.js     # or: npx 0x server.js`,
jmh: `// JMH micro-benchmark: warmup + forks + Blackhole
@State(Scope.Thread)
@Warmup(iterations = 5) @Measurement(iterations = 10)
@Fork(2) @BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
public class ParseBench {
  String json = Fixtures.order();
  @Benchmark
  public void parse(Blackhole bh) {
    bh.consume(OrderParser.parse(json));  // defeats dead-code elim
  }
}`,
pool: `Symptom at 300 RPS (3 pods):
  p50 60 ms -&gt; p99 2.1 s, CPU 35%, DB CPU 20%   =&gt; not compute-bound
  hikaricp_connections_pending   : 40-90
  hikaricp_connections_acquire p99: 1.9 s       =&gt; waiting for a conn

Why: each request holds a DB connection for 100 ms, because the
code opens a transaction, runs 3 queries (30 ms), then calls the
pricing API (70 ms) INSIDE the transaction.
  capacity per pod = pool / hold time = 10 / 0.100 s = 100 RPS
  3 pods                                         = 300 RPS  &lt;- knee

Fix: call pricing API before opening the transaction.
  hold time 30 ms =&gt; 10 / 0.030 = 333 RPS per pod (3.3x), same pool.
Then re-run: knee moves to ~950 RPS; next bottleneck = DB CPU.`,
budget: `# CI performance budget (runs on main, nightly on full data)
k6 run --summary-export=perf.json smoke-perf.js
python tools/compare_perf.py perf.json baseline.json \\
    --max-regression p95=10% --max-regression rps=-5%
# fail the build on regression; update baseline only via PR review`,

rvList: `Correctness   edge cases, nulls, empty, concurrency, time zones,
              error paths, retries + idempotency, off-by-one
Design        fits the architecture? right layer? new coupling?
              simpler alternative? reversible?
Tests         right level, meaningful asserts, failure cases,
              no sleeps, would they catch the bug this fixes?
Security      authz on every path, input validation, secrets,
              injection, logging PII, dependency risk
Operability   logs/metrics/traces, timeouts, feature flag,
              rollback plan, migration order, runbook, alerts
Performance   N+1 queries, unbounded loops/lists, missing index,
              hot path allocations, cache invalidation
Compatibility API/schema/event changes backward compatible?
              old clients, mixed versions during rollout
Readability   names, small functions, comments explain WHY`,
comments: `nit: rename tmp -&gt; pendingOrders (non-blocking)
suggestion: Duration.ofSeconds(2) reads better than 2000
question: what happens if pricing-api times out here? We hold
  the DB transaction while waiting.
issue (blocking): this endpoint loads the order by id without
  checking order.tenantId == caller.tenantId (IDOR).
praise: great test for the DST boundary, that bit us last year.`,
precommit: `# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.13.0
    hooks:
      - id: mypy
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks`,
gates: `PR gate (must pass to merge)       Signal, not gate
- build + unit + integration       - perf trend vs baseline
- lint, format, type check         - mutation score (nightly)
- coverage DELTA &gt;= 0 on changed    - code churn / hotspots
  lines (not a global %)           - review latency
- SAST: Semgrep / CodeQL (high)
- deps: osv-scanner / Trivy (crit)
- secrets: gitleaks
- licenses: no GPL in SaaS image
- 1-2 approvals + CODEOWNERS`
};

INFRA.lessons.push({
  id: "pr-performance-testing",
  track: "principal",
  order: 102,
  icon: "🏎️",
  level: 3,
  minutes: 17,
  title: { en: "Performance Testing & Profiling: k6, Flame Graphs, Finding the Bottleneck", he: "בדיקות ביצועים ו-Profiling: k6, Flame Graphs ומציאת צוואר הבקבוק" },
  tldr: {
    en: "Pick the test type by the question (load, stress, soak, spike, breakpoint), generate load with an open model so slowness isn't hidden, judge by p95/p99 and errors at a target rate, then profile with flame graphs to find the one bottleneck — fix it, re-run, and feed the measured capacity back into sizing.",
    he: "בוחרים את סוג הבדיקה לפי השאלה (load, stress, soak, spike, breakpoint), מייצרים עומס במודל פתוח כדי שאיטיות לא תוסתר, שופטים לפי p95/p99 ושגיאות בקצב יעד, ואז עושים profiling עם flame graphs כדי למצוא את צוואר הבקבוק האחד — מתקנים, מריצים שוב, ומחזירים את הקיבולת שנמדדה ל-sizing."
  },
  analogy: {
    en: "A load test is a fire drill for a stadium. You don't learn much by sending 10 people through the gates; you send the expected crowd at the expected rate and time how long the queues get. A closed-model test is like only letting the next fan in after someone sits down — the queue never forms, so you never see the crush. And a flame graph is the CCTV from above: it shows exactly which gate everyone is stuck at.",
    he: "Load test זה תרגיל חירום באצטדיון. לא לומדים הרבה משליחת 10 אנשים דרך השערים; שולחים את הקהל הצפוי בקצב הצפוי ומודדים כמה התורים מתארכים. בדיקה במודל סגור היא כמו להכניס אוהד הבא רק אחרי שמישהו התיישב — התור אף פעם לא נוצר, אז אף פעם לא רואים את הדוחק. ו-flame graph זה מצלמת האבטחה מלמעלה: היא מראה בדיוק באיזה שער כולם תקועים."
  },
  sections: [
    {
      h: { en: "Choose the test by the question", he: "בוחרים את הבדיקה לפי השאלה" },
      body: {
        en: `<p>"Run a load test" is not a plan. Start from the question and the number you need to defend:</p>
<pre>${P.kinds}</pre>
<p>Write the target first: <em>"At 500 RPS of the production mix, p95 &lt; 250 ms, p99 &lt; 600 ms, errors &lt; 0.1%, for 20 minutes, with 30% headroom on CPU."</em> Use a realistic <strong>traffic mix</strong> (from access logs: 70% reads, 20% search, 10% writes), realistic <strong>data volume</strong> (a 10k-row table hides the missing index that a 400M-row table exposes) and production-like instance types. Decide what's stubbed: hitting the real payment sandbox at 500 RPS gets you rate-limited, not informed.</p>
<blockquote>💡 Real world: the most valuable soak tests find slow leaks — a connection pool that grows by one per hour, a cache without TTL, logs filling a disk at 3 GB/hour. They only show up after hours, never in a 10-minute run.</blockquote>`,
        he: `<p>"תריץ load test" זו לא תוכנית. מתחילים מהשאלה ומהמספר שצריך להגן עליו:</p>
<pre>${P.kinds}</pre>
<p>קודם כותבים את היעד: <em>"ב-500 RPS עם תמהיל הפרודקשן, p95 &lt; 250ms, p99 &lt; 600ms, שגיאות &lt; 0.1%, למשך 20 דקות, עם 30% headroom ב-CPU."</em> משתמשים ב<strong>תמהיל תעבורה</strong> ריאלי (מה-access logs: 70% קריאות, 20% חיפוש, 10% כתיבות), <strong>נפח דאטה</strong> ריאלי (טבלה של 10k שורות מסתירה את ה-index החסר שטבלה של 400M שורות חושפת) וסוגי instances כמו בפרודקשן. מחליטים מה מוחלף ב-stub: לפגוע ב-sandbox של התשלומים ב-500 RPS יביא לך rate limit, לא מידע.</p>
<blockquote>💡 מהשטח: ה-soak tests הכי שווים מוצאים דליפות איטיות — connection pool שגדל באחד כל שעה, cache בלי TTL, לוגים שממלאים דיסק ב-3GB לשעה. הם מופיעים רק אחרי שעות, אף פעם לא בריצה של 10 דקות.</blockquote>`
      }
    },
    {
      h: { en: "A real k6 script: open model, thresholds, coordinated omission", he: "סקריפט k6 אמיתי: מודל פתוח, thresholds ו-coordinated omission" },
      body: {
        en: `<pre>${P.k6}</pre>
<p><strong>Open vs closed model.</strong> A closed model (N virtual users in a loop: request → wait for response → next) automatically slows down when the system slows down — so the load drops exactly when you wanted to see what happens under it. That's <strong>coordinated omission</strong>: the slow responses suppress the requests that would have measured the queueing. Real users don't wait for each other; use an <em>arrival-rate</em> executor (open model) so 500 requests/second arrive regardless.</p>
<pre>${P.k6out}</pre>
<p>Read it like this: throughput hit the target (487/s ≈ 500 with ramps), <code>dropped_iterations=0</code> means k6 had enough VUs to keep the rate, and every threshold passed. Look at the <strong>max</strong> and at p99 over time, not just the summary — a 3.1 s max with a fine p99 is often GC or a cold cache. Exclude the warm-up (JIT, connection pools, caches) or report it separately.</p>
<blockquote>⚠️ Production tip: always graph latency <em>against</em> throughput while ramping. The curve is flat, then bends sharply at the <strong>knee</strong> — that's your real capacity. Plan to run at ~60–70% of it (queueing theory: latency explodes as utilization approaches 100%).</blockquote>`,
        he: `<pre>${P.k6}</pre>
<p><strong>מודל פתוח מול סגור.</strong> מודל סגור (N משתמשים וירטואליים בלולאה: בקשה → מחכים לתשובה → הבאה) מאט אוטומטית כשהמערכת מאטה — אז העומס יורד בדיוק כשרצית לראות מה קורה תחתיו. זה <strong>coordinated omission</strong>: התשובות האיטיות מדכאות את הבקשות שהיו מודדות את התור. משתמשים אמיתיים לא מחכים אחד לשני; משתמשים ב-executor של <em>arrival-rate</em> (מודל פתוח) כך ש-500 בקשות לשנייה מגיעות לא משנה מה.</p>
<pre>${P.k6out}</pre>
<p>קוראים את זה כך: ה-throughput הגיע ליעד (487/s ≈ 500 עם ה-ramps), <code>dropped_iterations=0</code> אומר של-k6 היו מספיק VUs לשמור על הקצב, וכל ה-thresholds עברו. מסתכלים על ה-<strong>max</strong> ועל p99 לאורך זמן, לא רק על הסיכום — max של 3.1 שניות עם p99 תקין זה לרוב GC או cache קר. מוציאים את ה-warm-up (JIT, connection pools, caches) או מדווחים עליו בנפרד.</p>
<blockquote>⚠️ טיפ לפרודקשן: תמיד תצייר latency <em>מול</em> throughput בזמן ה-ramp. העקומה שטוחה ואז מתכופפת בחדות ב-<strong>knee</strong> — זו הקיבולת האמיתית שלך. מתכננים לרוץ ב-~60–70% ממנה (תורת התורים: ה-latency מתפוצץ כשהניצולת מתקרבת ל-100%).</blockquote>`
      }
    },
    {
      h: { en: "Profiling: flame graphs and honest benchmarks", he: "Profiling: flame graphs ו-benchmarks כנים" },
      body: {
        en: `<p>A load test tells you <em>that</em> you're slow; a profiler tells you <em>where</em>. A <strong>flame graph</strong> stacks sampled call stacks: width = share of samples (time), y-axis = call depth. Look for wide plateaus at the top — that's where CPU is actually spent. Profile <em>during</em> the load test, in a production-like environment; sampling profilers cost ~1–5% overhead and are safe to attach to a live process.</p>
<pre>${P.prof}</pre>
<p>CPU flame graphs miss time spent <em>waiting</em> (locks, I/O, pool acquisition). Use off-CPU/lock profiles (<code>-e lock</code>, <code>-e wall</code>) or your tracing spans for those.</p>
<p><strong>Micro vs macro benchmarks.</strong> A micro-benchmark (JMH, BenchmarkDotNet, Go <code>testing.B</code>, pytest-benchmark) measures one function in isolation — useful for a parser or a hash function, dangerous for decisions about the whole system. Pitfalls: no warm-up (JIT not compiled yet), dead-code elimination (the result is unused so the compiler removes the work), a noisy laptop on battery, and measuring with a cache that's warmer than production.</p>
<pre>${P.jmh}</pre>`,
        he: `<p>Load test אומר לך <em>שאתה</em> איטי; profiler אומר לך <em>איפה</em>. <strong>Flame graph</strong> מערם call stacks שנדגמו: רוחב = חלק מהדגימות (זמן), ציר y = עומק הקריאות. מחפשים מישורים רחבים למעלה — שם ה-CPU באמת נשרף. עושים profiling <em>במהלך</em> ה-load test, בסביבה דמוית פרודקשן; profilers מבוססי דגימה עולים ~1–5% overhead ובטוחים לחיבור ל-process חי.</p>
<pre>${P.prof}</pre>
<p>Flame graphs של CPU מפספסים זמן של <em>המתנה</em> (נעילות, I/O, השגת connection מה-pool). בשביל זה משתמשים בפרופילים off-CPU/lock (<code>-e lock</code>, <code>-e wall</code>) או ב-spans של ה-tracing.</p>
<p><strong>Micro מול macro benchmarks.</strong> Micro-benchmark (JMH, BenchmarkDotNet, <code>testing.B</code> ב-Go, pytest-benchmark) מודד פונקציה אחת בבידוד — שימושי ל-parser או לפונקציית hash, מסוכן להחלטות על המערכת כולה. מלכודות: בלי warm-up (ה-JIT עוד לא קימפל), dead-code elimination (התוצאה לא בשימוש אז הקומפיילר מוחק את העבודה), לפטופ רועש על סוללה, ומדידה עם cache חם יותר מבפרודקשן.</p>
<pre>${P.jmh}</pre>`
      }
    },
    {
      h: { en: "Worked example: the connection-pool knee", he: "דוגמה מלאה: ה-knee של ה-connection pool" },
      body: {
        en: `<p>A checkout API meets its SLO at 200 RPS and collapses at 300 RPS. CPU is low everywhere. Classic signs of a <strong>pool</strong> (DB connections, threads, HTTP client connections) rather than compute:</p>
<pre>${P.pool}</pre>
<p>The general law behind it is <strong>Little's Law</strong>: concurrency = throughput × time held. A pool of 10 can sustain at most 10 / hold-time requests per second. You raise capacity by <em>holding the resource for less time</em> (move slow calls out of transactions, add indexes) far more cheaply than by raising the pool — a bigger pool on every pod multiplies connections on the database (6 pods × 50 = 300 connections ≈ Postgres falling over).</p>
<p>Then <strong>close the loop</strong>: measured capacity per pod (333 RPS at the SLO) replaces the guess in your sizing doc, sets the HPA target, and becomes a CI <strong>performance budget</strong> so the next change can't silently give it back.</p>
<pre>${P.budget}</pre>`,
        he: `<p>API של checkout עומד ב-SLO ב-200 RPS וקורס ב-300 RPS. ה-CPU נמוך בכל מקום. סימנים קלאסיים ל-<strong>pool</strong> (DB connections, threads, connections של HTTP client) ולא לחישוב:</p>
<pre>${P.pool}</pre>
<p>החוק הכללי מאחורי זה הוא <strong>Little's Law</strong>: מקביליות = throughput × זמן ההחזקה. Pool של 10 יכול להחזיק לכל היותר 10 / hold-time בקשות לשנייה. מעלים קיבולת ע"י <em>החזקת המשאב לפחות זמן</em> (מוציאים קריאות איטיות מטרנזקציות, מוסיפים indexes) בזול הרבה יותר מהגדלת ה-pool — pool גדול יותר בכל pod מכפיל connections על ה-DB (6 pods × 50 = 300 connections ≈ Postgres נופל).</p>
<p>ואז <strong>סוגרים את הלולאה</strong>: הקיבולת שנמדדה ל-pod (333 RPS ב-SLO) מחליפה את הניחוש במסמך ה-sizing, קובעת את ה-target של ה-HPA, והופכת ל-<strong>performance budget</strong> ב-CI כדי שהשינוי הבא לא יחזיר אותה בשקט.</p>
<pre>${P.budget}</pre>`
      }
    }
  ],
  diagram: `latency
 (p99)  |                                   *
        |                                 *
        |                              *      <- queueing explodes
  600ms |- - - - - - - - - - - - - - -*- - - - SLO line
        |                         *
        |                    *  <- KNEE (real capacity)
        |  *  *  *  *  *  *
        +----------------------------------------> throughput (RPS)
           100   200   300   400   500   600
        plan to run at ~60-70% of the knee`,
  handsOn: [
    { cmd: "k6 run -e BASE=https://staging.example.internal load.js", what: { en: "Run the open-model script with thresholds; a failed threshold exits non-zero, so CI can gate on it.", he: "מריצים את הסקריפט במודל פתוח עם thresholds; threshold שנכשל מחזיר exit code שונה מאפס, כך שה-CI יכול לחסום לפיו." } },
    { cmd: "k6 run --out json=raw.json load.js && jq -r 'select(.metric==\"http_req_duration\") | .data.value' raw.json | sort -n | tail -5", what: { en: "Export raw samples and look at the worst requests, not just the summary percentiles.", he: "מייצאים דגימות גולמיות ומסתכלים על הבקשות הכי גרועות, לא רק על אחוזוני הסיכום." } },
    { cmd: "py-spy top --pid $(pgrep -f gunicorn | head -1)", what: { en: "A live 'top' of Python functions in a running worker — find the hot path in seconds.", he: "'top' חי של פונקציות Python ב-worker רץ — מוצאים את ה-hot path בשניות." } },
    { cmd: "go tool pprof -http=:8081 'http://localhost:6060/debug/pprof/profile?seconds=30'", what: { en: "Capture a 30 s CPU profile from a Go service and open the interactive flame graph.", he: "לוכדים CPU profile של 30 שניות משירות Go ופותחים flame graph אינטראקטיבי." } }
  ],
  mnemonic: {
    en: "Question → open load → p99 at target → flame graph → fix one thing → re-run → update sizing.",
    he: "שאלה → עומס פתוח → p99 ביעד → flame graph → מתקנים דבר אחד → מריצים שוב → מעדכנים sizing."
  },
  pitfalls: [
    { en: "Closed-model tools with a fixed number of users: when the system slows, they send less, hiding the latency you were trying to find (coordinated omission).", he: "כלים במודל סגור עם מספר משתמשים קבוע: כשהמערכת מאטה הם שולחים פחות, ומסתירים את ה-latency שחיפשת (coordinated omission)." },
    { en: "Testing on a tiny dataset or a warm cache. Missing indexes and cache-miss storms only appear at production data volumes and cold starts.", he: "לבדוק על dataset זעיר או cache חם. indexes חסרים וסערות cache-miss מופיעים רק בנפחי דאטה של פרודקשן וב-cold start." },
    { en: "Reporting averages. A 90 ms average can hide a 4 s p99 that every heavy user hits on every page load.", he: "לדווח ממוצעים. ממוצע של 90ms יכול להסתיר p99 של 4 שניות שכל משתמש כבד פוגש בכל טעינת עמוד." },
    { en: "Raising every pool size to 'fix' saturation. You move the bottleneck to the database and multiply connections across pods.", he: "להגדיל כל pool כדי 'לתקן' רוויה. מזיזים את צוואר הבקבוק ל-DB ומכפילים connections על פני ה-pods." }
  ],
  interview: [
    { q: { en: "p99 latency doubled after a release but CPU is flat. How do you investigate?", he: "p99 הוכפל אחרי release אבל ה-CPU שטוח. איך חוקרים?" },
      a: { en: "Flat CPU points to waiting, not computing. Compare traces before/after to find which span grew; check pool metrics (DB/HTTP connection acquire time, thread pool queue), lock contention, GC pauses, and downstream latency. Reproduce with an open-model load test on the old and new versions at the same rate, profile off-CPU/wall time, and diff the flame graphs. Typical culprits: a new call inside a transaction, an N+1 query, a lost index, a smaller pool or a synchronous call that used to be async.", he: "CPU שטוח מצביע על המתנה, לא חישוב. משווים traces לפני/אחרי כדי למצוא איזה span גדל; בודקים מטריקות pool (זמן השגת DB/HTTP connection, תור ה-thread pool), contention על נעילות, GC pauses ו-latency של downstream. משחזרים עם load test במודל פתוח על הגרסה הישנה והחדשה באותו קצב, עושים profiling של off-CPU/wall time, ומשווים flame graphs. חשודים טיפוסיים: קריאה חדשה בתוך טרנזקציה, N+1 query, index שאבד, pool קטן יותר או קריאה סינכרונית שפעם הייתה async." } },
    { q: { en: "What is coordinated omission and how do you avoid it?", he: "מה זה coordinated omission ואיך נמנעים ממנו?" },
      a: { en: "When the load generator waits for each response before sending the next, a slow system receives fewer requests, so the measurement omits exactly the requests that would have queued — latency looks far better than users experience. Avoid it with open-model / constant-arrival-rate generators (k6 arrival-rate executors, wrk2, Gatling open injection) and with HDR histograms that correct for the expected interval.", he: "כשמחולל העומס מחכה לכל תשובה לפני שהוא שולח את הבאה, מערכת איטית מקבלת פחות בקשות, אז המדידה משמיטה בדיוק את הבקשות שהיו נתקעות בתור — ה-latency נראה הרבה יותר טוב ממה שמשתמשים חווים. נמנעים עם מחוללים במודל פתוח / קצב הגעה קבוע (executors של arrival-rate ב-k6, wrk2, open injection ב-Gatling) ועם HDR histograms שמתקנים לפי המרווח הצפוי." } }
  ],
  quiz: [
    { q: { en: "Which test is designed to find slow memory or connection leaks?", he: "איזו בדיקה נועדה למצוא דליפות זיכרון או connections איטיות?" },
      options: [ { en: "Spike test", he: "Spike test" }, { en: "Soak test", he: "Soak test" }, { en: "Micro-benchmark", he: "Micro-benchmark" }, { en: "Smoke test", he: "Smoke test" } ],
      answer: 1, explain: { en: "Soak tests hold realistic load for hours, which is what it takes for slow leaks to surface.", he: "Soak tests מחזיקים עומס ריאלי לשעות — זה מה שנדרש כדי שדליפות איטיות יצופו." } },
    { q: { en: "A pool of 10 DB connections, each held 50 ms per request. Max requests per second per pod?", he: "Pool של 10 DB connections, כל אחת מוחזקת 50ms לבקשה. מקסימום בקשות לשנייה ל-pod?" },
      options: [ { en: "50", he: "50" }, { en: "200", he: "200" }, { en: "500", he: "500" }, { en: "10", he: "10" } ],
      answer: 1, explain: { en: "Little's Law: 10 / 0.05 s = 200 RPS. Halve the hold time and you double capacity without touching the pool.", he: "Little's Law: 10 / 0.05s = 200 RPS. חותכים את זמן ההחזקה בחצי ומכפילים את הקיבולת בלי לגעת ב-pool." } },
    { q: { en: "Why use an arrival-rate (open model) executor in k6?", he: "למה להשתמש ב-executor של arrival-rate (מודל פתוח) ב-k6?" },
      options: [ { en: "It uses fewer VUs", he: "הוא משתמש בפחות VUs" }, { en: "Requests keep arriving at the target rate even when the system slows, exposing queueing", he: "בקשות ממשיכות להגיע בקצב היעד גם כשהמערכת מאטה, וחושפות את התור" }, { en: "It disables thresholds", he: "הוא מבטל thresholds" }, { en: "It only works with HTTP/3", he: "הוא עובד רק עם HTTP/3" } ],
      answer: 1, explain: { en: "That's how real traffic behaves, and it avoids coordinated omission.", he: "כך תעבורה אמיתית מתנהגת, וזה מונע coordinated omission." } },
    { q: { en: "In a CPU flame graph, what does a wide frame near the top mean?", he: "ב-flame graph של CPU, מה אומר frame רחב קרוב לראש?" },
      options: [ { en: "A deep call stack", he: "call stack עמוק" }, { en: "A function where a large share of CPU samples were spent", he: "פונקציה שבה נשרף חלק גדול מדגימות ה-CPU" }, { en: "A function called many times but cheap", he: "פונקציה שנקראת הרבה פעמים אבל זולה" }, { en: "Time waiting on locks", he: "זמן המתנה לנעילות" } ],
      answer: 1, explain: { en: "Width is proportional to samples (time). Waiting time is off-CPU and needs a different profile.", he: "הרוחב פרופורציונלי לדגימות (זמן). זמן המתנה הוא off-CPU וצריך פרופיל אחר." } }
  ],
  related: ["pr-sizing", "rel-capacity-planning", "staff-queueing-tail-latency", "latency-numbers", "pr-observability-plan", "pr-garbage-collection", "pr-integration-testing"]
});

INFRA.lessons.push({
  id: "pr-code-review-quality",
  track: "principal",
  order: 103,
  icon: "🔍",
  level: 3,
  minutes: 15,
  title: { en: "Code Review & Quality Gates: Raising the Bar Without Being the Bottleneck", he: "Code Review ושערי איכות: להרים את הרף בלי להיות צוואר הבקבוק" },
  tldr: {
    en: "Automate everything a machine can check (format, lint, types, SAST, dependencies, secrets, coverage delta) as CI gates, keep PRs small, and spend human review on what machines can't see — correctness under failure, design, security of the logic, operability and compatibility — with clearly labeled, kind comments.",
    he: "מאטמטים כל מה שמכונה יכולה לבדוק (format, lint, types, SAST, תלויות, סודות, coverage delta) כשערים ב-CI, שומרים על PRs קטנים, ומשקיעים את ה-review האנושי במה שמכונה לא רואה — נכונות תחת כשלים, design, אבטחת הלוגיקה, operability ותאימות — עם הערות מתויגות וברורות."
  },
  analogy: {
    en: "Airport security has two layers. The X-ray machine and metal detector (CI gates) check every bag the same way, fast and without opinions. The trained officer (the reviewer) doesn't re-scan bags — they watch for what machines can't see: someone behaving strangely, a story that doesn't add up. A good officer also doesn't make every passenger wait for them personally; they train the staff and tune the machines so the line keeps moving.",
    he: "באבטחה בשדה תעופה יש שתי שכבות. מכונת השיקוף וגלאי המתכות (שערי ה-CI) בודקים כל תיק באותה צורה, מהר ובלי דעות. המאבטח המיומן (ה-reviewer) לא סורק שוב את התיקים — הוא מחפש את מה שמכונות לא רואות: מישהו שמתנהג מוזר, סיפור שלא מסתדר. ומאבטח טוב גם לא גורם לכל נוסע לחכות לו אישית; הוא מאמן את הצוות ומכייל את המכונות כדי שהתור ימשיך לזוז."
  },
  sections: [
    {
      h: { en: "What a principal actually looks for", he: "על מה Principal באמת מסתכל" },
      body: {
        en: `<p>Style is the machine's job. Human review is for the questions that need context:</p>
<pre>${P.rvList}</pre>
<p>The most valuable habit: <strong>review for failure modes</strong>. For every external call, ask "what if it's down, slow (30 s), returns garbage, or this code runs twice?" For every write, "what if we crash halfway?" For every list, "what if it has 10 million items?" For every new field in an API/event, "what does a client that doesn't know it do?"</p>
<blockquote>💡 Real world: read the tests first. They tell you what the author thinks the code does; then read the code and look for behavior the tests don't pin down. Missing failure-path tests are the most common real finding.</blockquote>`,
        he: `<p>סגנון זה התפקיד של המכונה. Review אנושי הוא לשאלות שצריכות הקשר:</p>
<pre>${P.rvList}</pre>
<p>ההרגל הכי שווה: <strong>review לפי failure modes</strong>. לכל קריאה חיצונית שואלים "מה אם הוא נפל, איטי (30 שניות), מחזיר זבל, או שהקוד הזה רץ פעמיים?" לכל כתיבה, "מה אם קרסנו באמצע?" לכל רשימה, "מה אם יש בה 10 מיליון פריטים?" לכל שדה חדש ב-API/event, "מה עושה client שלא מכיר אותו?"</p>
<blockquote>💡 מהשטח: קרא קודם את הבדיקות. הן אומרות לך מה הכותב חושב שהקוד עושה; ואז קרא את הקוד וחפש התנהגות שהבדיקות לא מקבעות. בדיקות חסרות למסלולי כשל הן הממצא האמיתי הכי נפוץ.</blockquote>`
      }
    },
    {
      h: { en: "Small PRs, stacked diffs and comments people can act on", he: "PRs קטנים, stacked diffs והערות שאפשר לפעול לפיהן" },
      body: {
        en: `<p>Review quality falls off a cliff with size: past roughly 400 changed lines, reviewers skim and approve. Keep PRs to <strong>one logical change</strong> (often 50–300 lines) and separate mechanical changes (renames, formatting, moves) from behavior changes. For a large feature, use <strong>stacked diffs</strong>: PR 1 adds the schema (expand), PR 2 the repository, PR 3 the endpoint behind a flag — each reviewable in minutes, merged in order (Graphite, ghstack, or <code>git rebase --update-refs</code>).</p>
<p>A PR description answers: <em>why</em> (link the ticket/design), <em>what</em> changed, <em>how it was tested</em>, <em>risk and rollback</em> (flag? migration order?), and screenshots for UI.</p>
<p>Label every comment so the author knows what's required (<strong>Conventional Comments</strong>):</p>
<pre>${P.comments}</pre>
<p>Critique the code, not the person ("this loop", not "you"), ask questions when unsure, explain the <em>why</em>, and approve with optional nits rather than blocking on taste. Set a team norm for response time (e.g. first response within 4 working hours) — slow reviews cause bigger PRs, which cause slower reviews.</p>`,
        he: `<p>איכות ה-review צונחת עם הגודל: מעבר ל-~400 שורות ששונו, reviewers מרפרפים ומאשרים. שומרים PRs על <strong>שינוי לוגי אחד</strong> (לרוב 50–300 שורות) ומפרידים שינויים מכניים (שינויי שמות, format, הזזות) משינויי התנהגות. לפיצ'ר גדול משתמשים ב-<strong>stacked diffs</strong>: PR 1 מוסיף את הסכמה (expand), PR 2 את ה-repository, PR 3 את ה-endpoint מאחורי flag — כל אחד נבדק בדקות ונכנס לפי הסדר (Graphite, ghstack או <code>git rebase --update-refs</code>).</p>
<p>תיאור PR עונה על: <em>למה</em> (קישור לטיקט/design), <em>מה</em> השתנה, <em>איך זה נבדק</em>, <em>סיכון ו-rollback</em> (flag? סדר מיגרציה?), וצילומי מסך ל-UI.</p>
<p>מתייגים כל הערה כדי שהכותב יידע מה חובה (<strong>Conventional Comments</strong>):</p>
<pre>${P.comments}</pre>
<p>מבקרים את הקוד, לא את האדם ("הלולאה הזו", לא "אתה"), שואלים כשלא בטוחים, מסבירים את ה-<em>למה</em>, ומאשרים עם nits אופציונליים במקום לחסום על טעם אישי. קובעים נורמה צוותית לזמן תגובה (למשל תגובה ראשונה תוך 4 שעות עבודה) — reviews איטיים גורמים ל-PRs גדולים יותר, שגורמים ל-reviews איטיים יותר.</p>`
      }
    },
    {
      h: { en: "Quality gates: let machines say no", he: "שערי איכות: לתת למכונות להגיד לא" },
      body: {
        en: `<pre>${P.gates}</pre>
<table><tr><th>Language</th><th>Lint / format</th><th>Types</th><th>Security / bugs</th></tr>
<tr><td>Python</td><td>ruff, ruff format</td><td>mypy / pyright</td><td>bandit, Semgrep, pip-audit</td></tr>
<tr><td>JS/TS</td><td>ESLint, Prettier / Biome</td><td>tsc --noEmit</td><td>Semgrep, npm audit, CodeQL</td></tr>
<tr><td>Java/Kotlin</td><td>Checkstyle, Spotless, ktlint</td><td>compiler</td><td>Error Prone, SpotBugs, CodeQL</td></tr>
<tr><td>Go</td><td>gofmt, golangci-lint</td><td>compiler</td><td>govulncheck, gosec</td></tr>
<tr><td>C#</td><td>dotnet format</td><td>compiler + nullable</td><td>Roslyn analyzers, CodeQL</td></tr></table>
<p>Run the cheap checks locally with <strong>pre-commit</strong> hooks so CI failures are rare:</p>
<pre>${P.precommit}</pre>
<blockquote>⚠️ Production tip: gate on the <em>delta</em>, not the backlog. "No new high-severity SAST findings and coverage on changed lines ≥ 80%" is achievable today; "fix all 2,400 legacy findings first" means the gate gets disabled next week.</blockquote>`,
        he: `<pre>${P.gates}</pre>
<table><tr><th>שפה</th><th>Lint / format</th><th>Types</th><th>אבטחה / באגים</th></tr>
<tr><td>Python</td><td>ruff, ruff format</td><td>mypy / pyright</td><td>bandit, Semgrep, pip-audit</td></tr>
<tr><td>JS/TS</td><td>ESLint, Prettier / Biome</td><td>tsc --noEmit</td><td>Semgrep, npm audit, CodeQL</td></tr>
<tr><td>Java/Kotlin</td><td>Checkstyle, Spotless, ktlint</td><td>קומפיילר</td><td>Error Prone, SpotBugs, CodeQL</td></tr>
<tr><td>Go</td><td>gofmt, golangci-lint</td><td>קומפיילר</td><td>govulncheck, gosec</td></tr>
<tr><td>C#</td><td>dotnet format</td><td>קומפיילר + nullable</td><td>Roslyn analyzers, CodeQL</td></tr></table>
<p>מריצים את הבדיקות הזולות מקומית עם hooks של <strong>pre-commit</strong>, כדי שכשלים ב-CI יהיו נדירים:</p>
<pre>${P.precommit}</pre>
<blockquote>⚠️ טיפ לפרודקשן: חוסמים לפי ה-<em>delta</em>, לא לפי ה-backlog. "אין ממצאי SAST חדשים בחומרה גבוהה, ו-coverage על השורות ששונו ≥ 80%" זה בר-השגה היום; "קודם לתקן את כל 2,400 הממצאים הישנים" אומר שהשער יכובה בשבוע הבא.</blockquote>`
      }
    },
    {
      h: { en: "Design review vs code review — and measuring quality", he: "Design review מול code review — ומדידת איכות" },
      body: {
        en: `<p>Code review is the <strong>worst</strong> place to discover that the design is wrong — the code is written, the author is invested, and the change is expensive. Big decisions belong in a short design doc or <strong>ADR</strong> reviewed <em>before</em> coding; code review then checks the implementation matches. A principal spends more time in design reviews and less in line-by-line review.</p>
<p>Measure the system, not individuals:</p>
<table><tr><th>Metric</th><th>Healthy signal</th></tr>
<tr><td>DORA: deployment frequency</td><td>daily or more for active services</td></tr>
<tr><td>DORA: lead time for changes</td><td>&lt; 1 day from commit to production</td></tr>
<tr><td>DORA: change failure rate</td><td>&lt; 15% of deploys cause a rollback/incident</td></tr>
<tr><td>DORA: time to restore</td><td>&lt; 1 hour</td></tr>
<tr><td>Escaped defects</td><td>bugs found in prod per release, trending down</td></tr>
<tr><td>Review latency / PR size</td><td>median first response &lt; 4 h, median PR &lt; 300 lines</td></tr></table>
<p><strong>Raising the bar without being the bottleneck:</strong> if you write the same comment three times, turn it into a lint rule, a template or a guide; use CODEOWNERS to spread review across trusted owners; review designs early and pair on risky changes; teach in comments ("here's why…") so the next PR doesn't need you.</p>`,
        he: `<p>Code review הוא המקום <strong>הכי גרוע</strong> לגלות שה-design שגוי — הקוד כבר כתוב, הכותב מושקע, והשינוי יקר. החלטות גדולות שייכות למסמך design קצר או ל-<strong>ADR</strong> שעובר review <em>לפני</em> כתיבת קוד; ה-code review אז בודק שהמימוש תואם. Principal משקיע יותר זמן ב-design reviews ופחות ב-review שורה אחר שורה.</p>
<p>מודדים את המערכת, לא אנשים:</p>
<table><tr><th>מדד</th><th>אות בריא</th></tr>
<tr><td>DORA: תדירות deploy</td><td>יומי או יותר לשירותים פעילים</td></tr>
<tr><td>DORA: lead time לשינוי</td><td>&lt; יום מ-commit לפרודקשן</td></tr>
<tr><td>DORA: change failure rate</td><td>&lt; 15% מה-deploys גורמים ל-rollback/תקלה</td></tr>
<tr><td>DORA: זמן התאוששות</td><td>&lt; שעה</td></tr>
<tr><td>Escaped defects</td><td>באגים שנמצאו בפרודקשן לכל release, במגמת ירידה</td></tr>
<tr><td>Review latency / גודל PR</td><td>חציון תגובה ראשונה &lt; 4 שעות, חציון PR &lt; 300 שורות</td></tr></table>
<p><strong>להרים את הרף בלי להיות צוואר הבקבוק:</strong> אם כתבת את אותה הערה שלוש פעמים, הפוך אותה לחוק lint, לתבנית או למדריך; השתמש ב-CODEOWNERS כדי לפזר review בין בעלים מהימנים; עשה review ל-designs מוקדם ו-pairing על שינויים מסוכנים; ולמד דרך ההערות ("הנה למה…") כדי שה-PR הבא כבר לא יצטרך אותך.</p>`
      }
    }
  ],
  diagram: `  idea --> design doc / ADR review   (big decisions, cheap to change)
                 |
                 v
  code --> pre-commit (format, lint, secrets)        seconds, local
                 |
                 v
  PR  --> CI gates: build, tests, types, SAST,        minutes, machine
          deps, licenses, coverage delta
                 |
                 v
          human review: failure modes, design fit,   minutes, human
          security logic, operability, compat
                 |
                 v
  merge --> canary + SLO alerts (the last reviewer is production)`,
  handsOn: [
    { cmd: "pre-commit install && pre-commit run --all-files", what: { en: "Install the hooks and run them on the whole repo once — fix the baseline before turning on the CI gate.", he: "מתקינים את ה-hooks ומריצים פעם אחת על כל ה-repo — מתקנים את ה-baseline לפני שמדליקים את השער ב-CI." } },
    { cmd: "semgrep scan --config p/owasp-top-ten --baseline-commit origin/main", what: { en: "SAST that reports only findings introduced since main — the 'gate on the delta' approach.", he: "SAST שמדווח רק על ממצאים שנוספו מאז main — גישת 'חוסמים לפי ה-delta'." } },
    { cmd: "osv-scanner --recursive . && gitleaks detect --source . --redact", what: { en: "Known-vulnerable dependencies and committed secrets in one pass.", he: "תלויות עם חולשות ידועות וסודות שנכנסו ל-commit — במעבר אחד." } },
    { cmd: "gh pr list --state merged --limit 100 --json additions,deletions,createdAt,mergedAt", what: { en: "Pull PR size and time-to-merge for the last 100 PRs to see whether reviews are a bottleneck.", he: "שולפים גודל PR וזמן עד merge ל-100 ה-PRs האחרונים כדי לראות אם ה-review הוא צוואר בקבוק." } }
  ],
  mnemonic: {
    en: "Machines check style, humans check failure. Small PRs, labeled comments, gates on the delta, designs before code.",
    he: "מכונות בודקות סגנון, בני אדם בודקים כשלים. PRs קטנים, הערות מתויגות, שערים על ה-delta, design לפני קוד."
  },
  pitfalls: [
    { en: "Spending review time on formatting and naming nits a formatter or linter could enforce, while missing the missing authorization check.", he: "לבזבז זמן review על nits של format ושמות שה-formatter או ה-linter יכולים לאכוף, ולפספס את בדיקת ההרשאה החסרה." },
    { en: "Approving a 2,000-line PR because reading it properly would take a day. Ask for it to be split; the risk is real.", he: "לאשר PR של 2,000 שורות כי לקרוא אותו כמו שצריך ייקח יום. בקש לפצל אותו; הסיכון אמיתי." },
    { en: "Turning on a gate against the whole legacy backlog. It fails every build, gets bypassed, and teaches people to ignore gates.", he: "להדליק שער מול כל ה-backlog הישן. הוא מכשיל כל build, עוקפים אותו, וזה מלמד אנשים להתעלם משערים." },
    { en: "Being the only approver for a critical area. You become the bottleneck and the bus factor; grow other owners.", he: "להיות המאשר היחיד לאזור קריטי. הופכים לצוואר הבקבוק ול-bus factor; תגדל בעלים נוספים." }
  ],
  interview: [
    { q: { en: "How do you raise code quality across 10 teams without reviewing every PR yourself?", he: "איך מעלים איכות קוד ב-10 צוותים בלי לעשות review לכל PR בעצמך?" },
      a: { en: "Encode standards so they scale: shared lint/format configs, pre-commit and CI gates on the delta (SAST, deps, secrets, coverage on changed lines), PR templates with testing and rollback sections. Put judgment earlier: lightweight design reviews/ADRs for significant changes. Spread ownership with CODEOWNERS and a reviewer guild, run calibration sessions on example PRs, and track DORA metrics and escaped defects to see whether it's working — then turn repeated review comments into rules.", he: "מקודדים סטנדרטים כך שיתרחבו: קונפיגורציות lint/format משותפות, pre-commit ושערי CI על ה-delta (SAST, תלויות, סודות, coverage על שורות שהשתנו), תבניות PR עם סעיפי בדיקות ו-rollback. מקדימים את שיקול הדעת: design reviews/ADRs קלים לשינויים משמעותיים. מפזרים בעלות עם CODEOWNERS וגילדת reviewers, עושים סשנים של כיול על PRs לדוגמה, ומודדים DORA ו-escaped defects כדי לראות שזה עובד — ואז הופכים הערות review חוזרות לחוקים." } },
    { q: { en: "What's the first thing you check in a PR that adds a call to another service?", he: "מה הדבר הראשון שבודקים ב-PR שמוסיף קריאה לשירות אחר?" },
      a: { en: "Its failure behavior: is there a timeout shorter than the caller's budget, are retries bounded with backoff and only on idempotent operations, what's the fallback if it's down, is it inside a DB transaction or a lock (it shouldn't be), is there a circuit breaker, and are there metrics/traces for it. Then authz and data exposure, then the tests for the failure paths.", he: "את התנהגות הכשל שלה: יש timeout קצר מהתקציב של הקורא, retries מוגבלים עם backoff ורק על פעולות אידמפוטנטיות, מה ה-fallback אם הוא נפל, האם היא בתוך טרנזקציית DB או נעילה (אסור), יש circuit breaker, ויש מטריקות/traces. אחר כך authz וחשיפת דאטה, ואז הבדיקות למסלולי הכשל." } }
  ],
  quiz: [
    { q: { en: "Which belongs in an automated CI gate rather than human review?", he: "מה שייך לשער CI אוטומטי ולא ל-review אנושי?" },
      options: [ { en: "Whether the design fits the architecture", he: "האם ה-design מתאים לארכיטקטורה" }, { en: "Formatting, lint, known-vulnerable dependencies and committed secrets", he: "Format, lint, תלויות עם חולשות ידועות וסודות שנכנסו לקוד" }, { en: "Whether the rollback plan is realistic", he: "האם תוכנית ה-rollback ריאלית" }, { en: "Whether a retry is safe for this operation", he: "האם retry בטוח לפעולה הזו" } ],
      answer: 1, explain: { en: "Deterministic, rule-based checks are cheap and consistent for machines; judgment calls need humans.", he: "בדיקות דטרמיניסטיות מבוססות חוקים זולות ועקביות למכונות; שיקול דעת צריך בני אדם." } },
    { q: { en: "A new SAST gate fails every build because of 2,400 old findings. Best move?", he: "שער SAST חדש מכשיל כל build בגלל 2,400 ממצאים ישנים. הצעד הכי טוב?" },
      options: [ { en: "Disable the gate", he: "לכבות את השער" }, { en: "Gate only on new findings vs a baseline and burn down the backlog separately", he: "לחסום רק על ממצאים חדשים מול baseline ולשרוף את ה-backlog בנפרד" }, { en: "Make every team fix all findings this sprint", he: "לחייב כל צוות לתקן את כל הממצאים בספרינט הזה" }, { en: "Lower the severity of all rules", he: "להוריד את החומרה של כל החוקים" } ],
      answer: 1, explain: { en: "Gating on the delta stops the bleeding today without blocking all delivery.", he: "חסימה לפי ה-delta עוצרת את הדימום היום בלי לחסום את כל ה-delivery." } },
    { q: { en: "Which DORA metric captures how often deployments cause failures?", he: "איזה מדד DORA מודד באיזו תדירות deploys גורמים לכשלים?" },
      options: [ { en: "Lead time for changes", he: "Lead time לשינוי" }, { en: "Change failure rate", he: "Change failure rate" }, { en: "Deployment frequency", he: "תדירות deploy" }, { en: "Code coverage", he: "Code coverage" } ],
      answer: 1, explain: { en: "Change failure rate = share of deployments that cause an incident, rollback or hotfix.", he: "Change failure rate = אחוז ה-deploys שגורמים לתקלה, rollback או hotfix." } },
    { q: { en: "What does a comment labeled 'nit:' signal in Conventional Comments?", he: "מה מסמנת הערה עם התווית 'nit:' ב-Conventional Comments?" },
      options: [ { en: "Must be fixed before merge", he: "חובה לתקן לפני merge" }, { en: "A minor, non-blocking preference", he: "העדפה קטנה, לא חוסמת" }, { en: "A security issue", he: "בעיית אבטחה" }, { en: "A question for the author", he: "שאלה לכותב" } ],
      answer: 1, explain: { en: "Labels make intent explicit so authors don't treat taste as a blocker.", he: "תוויות הופכות את הכוונה למפורשת כדי שכותבים לא יתייחסו לטעם אישי כחוסם." } }
  ],
  related: ["pr-validate-yourself", "staff-design-docs", "cloud-cicd", "staff-supply-chain", "pr-owasp-2025", "pr-test-strategy", "pr-unit-testing-craft"]
});

INFRA.glossary.push(
  { term: "Test double", track: "principal", def: { en: "Any stand-in for a real dependency in a test: dummy, stub, fake, spy or mock.", he: "כל תחליף לתלות אמיתית בבדיקה: dummy, stub, fake, spy או mock." }, lesson: "pr-unit-testing-craft" },
  { term: "Mutation testing", track: "principal", def: { en: "Automatically injects small bugs into code and reruns tests; surviving mutants reveal what the tests don't actually check.", he: "מזריק אוטומטית באגים קטנים לקוד ומריץ את הבדיקות שוב; mutants ששורדים חושפים מה הבדיקות לא באמת בודקות." }, lesson: "pr-unit-testing-craft" },
  { term: "Property-based testing", track: "principal", def: { en: "Tests that state an invariant for all inputs; the tool generates many inputs and shrinks failures to a minimal counter-example.", he: "בדיקות שמנסחות אינווריאנט לכל הקלטים; הכלי מייצר הרבה קלטים ומכווץ כשלים לדוגמה-נגדית מינימלית." }, lesson: "pr-unit-testing-craft" },
  { term: "Testcontainers", track: "principal", def: { en: "Library that starts real, disposable Docker dependencies (Postgres, Kafka, Redis) from inside integration tests.", he: "ספרייה שמרימה תלויות Docker אמיתיות וחד-פעמיות (Postgres, Kafka, Redis) מתוך integration tests." }, lesson: "pr-integration-testing" },
  { term: "Flaky test", track: "principal", def: { en: "A test that passes and fails on the same code; usually caused by time, ordering, shared state or async waits.", he: "בדיקה שעוברת ונכשלת על אותו קוד; לרוב בגלל זמן, סדר, state משותף או המתנות async." }, lesson: "pr-integration-testing" },
  { term: "Flame graph", track: "principal", def: { en: "Visualization of sampled stack traces where width shows the share of time spent in each function.", he: "ויזואליזציה של stack traces שנדגמו, שבה הרוחב מראה את חלק הזמן שהושקע בכל פונקציה." }, lesson: "pr-performance-testing" },
  { term: "Soak test", track: "principal", def: { en: "A long load test (hours) at realistic load to expose leaks and slow degradation.", he: "Load test ארוך (שעות) בעומס ריאלי כדי לחשוף דליפות והידרדרות איטית." }, lesson: "pr-performance-testing" },
  { term: "Quality gate", track: "principal", def: { en: "An automated CI check that blocks a merge or release when a rule fails (tests, SAST, coverage delta, dependencies).", he: "בדיקת CI אוטומטית שחוסמת merge או release כשחוק נכשל (בדיקות, SAST, coverage delta, תלויות)." }, lesson: "pr-code-review-quality" },
  { term: "Stacked diffs", track: "principal", def: { en: "A large change split into a chain of small dependent PRs, reviewed and merged in order.", he: "שינוי גדול שמפוצל לשרשרת של PRs קטנים ותלויים, שעוברים review ונכנסים לפי הסדר." }, lesson: "pr-code-review-quality" },
  { term: "Conventional Comments", track: "principal", def: { en: "Labeling review comments (nit, suggestion, question, issue (blocking), praise) so intent and severity are explicit.", he: "תיוג הערות review (nit, suggestion, question, issue (blocking), praise) כדי שהכוונה והחומרה יהיו מפורשות." }, lesson: "pr-code-review-quality" }
);
})();
