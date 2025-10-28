export default async (req: Request) => {
  try {
    const requestBodyText = await req.text();
    let price, description;
    try {
      const jsonBody = JSON.parse(requestBodyText);
      price = jsonBody.price;
      description = jsonBody.description;
    } catch (jsonErr) {
      console.error('JSON parsing error:', jsonErr);
      console.error('Raw request body:', requestBodyText);
      throw new Error('Invalid JSON in request body');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not found');
    }

    const stripeApiUrl = 'https://api.stripe.com/v1/checkout/sessions';
    const response = await fetch(stripeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'mode': 'payment',
        'success_url': `${req.headers.get('origin')}/success`,
        'cancel_url': `${req.headers.get('origin')}/cancel`,
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][unit_amount]': Math.round(price * 100).toString(),
        'line_items[0][price_data][product_data][name]': description,
        'line_items[0][quantity]': '1',
      }).toString(),
    });

    const sessionData = await response.json();

    if (!response.ok) {
      console.error('Stripe API error:', sessionData);
      throw new Error(sessionData.error?.message || 'Stripe API error');
    }

    return new Response(JSON.stringify({ id: sessionData.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'Errore creazione sessione' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
