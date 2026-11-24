import { test as base, expect, APIRequestContext } from '@playwright/test';

/**
 * Restful-Booker API – https://restful-booker.herokuapp.com/apidoc/index.html
 *
 * Every test is independent: it creates its own uniquely named booking through the
 * `booking` fixture, and the fixture deletes it afterwards. No test relies on another
 * test's data, and nothing touches bookings made by other people.
 */

interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function newBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: `QA-${uid()}`,
    lastname: `Tester-${uid()}`,
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: '2027-01-10', checkout: '2027-01-15' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

async function getToken(request: APIRequestContext): Promise<string> {
  const res = await request.post('/auth', { data: { username: 'admin', password: 'password123' } });
  expect(res.status()).toBe(200);
  const { token } = await res.json();
  expect(token).toEqual(expect.any(String));
  return token;
}

const NON_EXISTENT_ID = 987654321;

type Fixtures = {
  token: string;
  auth: { Cookie: string };
  /** Remember a booking id so it is deleted after the test. */
  track: (id: number) => void;
  /** A fresh booking owned by this test. */
  booking: { id: number; data: Booking };
};

const test = base.extend<Fixtures>({
  token: async ({ request }, use) => {
    await use(await getToken(request));
  },
  auth: async ({ token }, use) => {
    await use({ Cookie: `token=${token}` });
  },
  track: async ({ request, auth }, use) => {
    const ids: number[] = [];
    await use((id) => ids.push(id));
    for (const id of ids) {
      await request.delete(`/booking/${id}`, { headers: auth }); // best-effort cleanup
    }
  },
  booking: async ({ request, track }, use) => {
    const data = newBooking();
    const res = await request.post('/booking', { data });
    expect(res.status()).toBe(200);
    const id: number = (await res.json()).bookingid;
    track(id);
    await use({ id, data });
  },
});

test.describe('Auth', () => {
  test('valid credentials return a token', async ({ request }) => {
    const token = await getToken(request);
    expect(token.length).toBeGreaterThan(5);
  });

  test('invalid credentials return "Bad credentials" and no token', async ({ request }) => {
    const res = await request.post('/auth', { data: { username: 'admin', password: 'wrong' } });

    expect(res.status()).toBe(200); // should be 401 – see BUG-12
    const body = await res.json();
    expect(body).toEqual({ reason: 'Bad credentials' });
    expect(body.token).toBeUndefined();
  });
});

test.describe('Create', () => {
  test('POST /booking creates a booking and echoes the data', async ({ request, track }) => {
    const data = newBooking();
    const res = await request.post('/booking', { data });

    expect(res.status()).toBe(200);
    const body = await res.json();
    track(body.bookingid);
    expect(body.bookingid).toEqual(expect.any(Number));
    expect(body.booking).toEqual(data);
  });

  test('edge: optional "additionalneeds" can be left out', async ({ request, track }) => {
    const { additionalneeds, ...data } = newBooking();
    const res = await request.post('/booking', { data });

    expect(res.status()).toBe(200);
    const body = await res.json();
    track(body.bookingid);
    expect(body.booking).toEqual(data);
    expect(body.booking).not.toHaveProperty('additionalneeds');
  });

  // bug-reports/bugs.md: BUG-09
  test('BUG-09: missing required fields return 400', async ({ request }) => {
    test.fail(true, 'Known defect BUG-09 – API returns 500');
    const res = await request.post('/booking', { data: { firstname: `QA-${uid()}` } });
    expect(res.status()).toBe(400);
  });

  // bug-reports/bugs.md: BUG-11
  test('BUG-11: checkout before checkin is rejected', async ({ request, track }) => {
    test.fail(true, 'Known defect BUG-11 – invalid date range is accepted');
    const data = newBooking({ bookingdates: { checkin: '2027-01-15', checkout: '2027-01-10' } });
    const res = await request.post('/booking', { data });
    if (res.ok()) track((await res.json()).bookingid);

    expect(res.status()).toBe(400);
  });
});

test.describe('Read', () => {
  test('GET /booking/:id returns the booking', async ({ request, booking }) => {
    const res = await request.get(`/booking/${booking.id}`);

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual(booking.data);
  });

  test('GET /booking filtered by name finds the booking', async ({ request, booking }) => {
    const res = await request.get('/booking', {
      params: { firstname: booking.data.firstname, lastname: booking.data.lastname },
    });

    expect(res.status()).toBe(200);
    const ids = (await res.json()).map((b: { bookingid: number }) => b.bookingid);
    expect(ids).toEqual([booking.id]); // unique names → exactly one match
  });

  test('negative: wrong id returns 404', async ({ request }) => {
    const res = await request.get(`/booking/${NON_EXISTENT_ID}`);
    expect(res.status()).toBe(404);
  });

  test('negative: non-numeric id returns 404', async ({ request }) => {
    const res = await request.get('/booking/abc');
    expect(res.status()).toBe(404);
  });
});

test.describe('Update', () => {
  test('PUT replaces the whole booking', async ({ request, booking, auth }) => {
    const updated = newBooking({ totalprice: 999, depositpaid: false, additionalneeds: 'Dinner' });
    const res = await request.put(`/booking/${booking.id}`, { data: updated, headers: auth });

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(await (await request.get(`/booking/${booking.id}`)).json()).toEqual(updated);
  });

  test('PATCH changes only the given field', async ({ request, booking, auth }) => {
    const res = await request.patch(`/booking/${booking.id}`, {
      data: { additionalneeds: 'Late checkout' },
      headers: auth,
    });

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ...booking.data, additionalneeds: 'Late checkout' });
  });

  test('edge: PATCH also accepts Basic auth instead of a token', async ({ request, booking }) => {
    const basic = 'Basic ' + Buffer.from('admin:password123').toString('base64');
    const res = await request.patch(`/booking/${booking.id}`, {
      data: { totalprice: 1 },
      headers: { Authorization: basic },
    });

    expect(res.status()).toBe(200);
    expect((await res.json()).totalprice).toBe(1);
  });

  test('negative: PUT without a token returns 403 and changes nothing', async ({ request, booking }) => {
    const res = await request.put(`/booking/${booking.id}`, { data: newBooking() });

    expect(res.status()).toBe(403);
    expect(await (await request.get(`/booking/${booking.id}`)).json()).toEqual(booking.data);
  });

  test('negative: PATCH with an invalid token returns 403', async ({ request, booking }) => {
    const res = await request.patch(`/booking/${booking.id}`, {
      data: { firstname: 'Hacker' },
      headers: { Cookie: 'token=not-a-real-token' },
    });

    expect(res.status()).toBe(403);
  });

  // bug-reports/bugs.md: BUG-10
  test('BUG-10: PUT on a wrong id returns 404', async ({ request, auth }) => {
    test.fail(true, 'Known defect BUG-10 – API returns 405');
    const res = await request.put(`/booking/${NON_EXISTENT_ID}`, { data: newBooking(), headers: auth });
    expect(res.status()).toBe(404);
  });
});

test.describe('Delete', () => {
  test('DELETE removes the booking', async ({ request, booking, auth }) => {
    const res = await request.delete(`/booking/${booking.id}`, { headers: auth });

    expect(res.status()).toBe(201); // should be 200/204 – see BUG-12
    expect((await request.get(`/booking/${booking.id}`)).status()).toBe(404);
  });

  test('negative: DELETE without a token returns 403 and keeps the booking', async ({ request, booking }) => {
    const res = await request.delete(`/booking/${booking.id}`);

    expect(res.status()).toBe(403);
    expect((await request.get(`/booking/${booking.id}`)).status()).toBe(200);
  });

  // bug-reports/bugs.md: BUG-10
  test('BUG-10: DELETE on a wrong id returns 404', async ({ request, auth }) => {
    test.fail(true, 'Known defect BUG-10 – API returns 405');
    const res = await request.delete(`/booking/${NON_EXISTENT_ID}`, { headers: auth });
    expect(res.status()).toBe(404);
  });
});
