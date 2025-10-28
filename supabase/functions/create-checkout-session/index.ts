// @ts-ignore – esm.sh module resolution
import Stripe from 'https://esm.sh/stripe@12.12.0?target=deno&deno-std=0.177.0'

export default async (req: Request) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!,
    {
      apiVersion: '2023-10-16',
    })

  try {
    const { price, description } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success`,
      cancel_url: `${req.headers.get('origin')}/cancel`,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(price * 100), // da euro a cent
            product_data: { name: description },
          },
          quantity: 1,
        },
      ],
    })

    return new Response(JSON.stringify({ id: session.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: 'Errore creazione sessione' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
