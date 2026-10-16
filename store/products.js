/* TRNT BEE Store — every product lives here.
   To publish a product: copy a block below, give it a unique id, and set status to 'available'.

   status:   'available'   — can be bought
             'preorder'    — can be bought, marked as pre-order
             'coming-soon' — visible, shows "Notify me" instead of "Add to bag"
             'sold-out'    — visible, can't be bought
   images:   paths from the site root, e.g. 'images/merch/olive-front.webp' (first = cover, second = shown on hover)
   price:    in rupees; leave null until it's decided
   compareAt: optional old price, shown struck through */

window.STORE = {
  currency: '₹',
  orderEmail: 'beesociety101@gmail.com',
  // Add a WhatsApp number with country code, digits only (e.g. '919876543210') to enable "Order on WhatsApp".
  orderWhatsApp: '',
  shippingNote: 'Shipping across India. Delivery time and charges are confirmed with you before payment.',
  announcement: 'BEE — Collection 01 is coming soon. Join the list to hear first.',

  // the current campaign, shown at the top of the store and on the main site
  collection: {
    name: 'BEE — Collection 01',
    tagline: 'Still here. Further now.',
    intro: 'A journey beyond the ordinary. Quiet strength. Relentless spirit.',
    story: 'Some journeys are fought in silence. Some stories are worn, not told.',
    closer: 'Not made to follow. Made to move forward.',
    status: 'Coming soon',
    tags: ['#BEE', '#StillHereFurtherNow', '#Collection01', '#StreetwearIndia']
  },

  products: [
    {
      id: 'still-here-olive',
      name: 'Still Here Tee — Olive',
      category: 'T-shirts',
      color: 'Olive',
      price: null,
      compareAt: null,
      status: 'coming-soon',
      images: ['images/merch/olive-front.webp', 'images/merch/olive-back.webp', 'images/merch/olive-lookbook.webp'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      desc: 'A journey beyond the ordinary. Quiet strength. Relentless spirit. A lone wanderer under a full moon across the back, and "Still here, further now" on the chest.',
      details: ['Oversized fit', 'Small chest print, full back artwork', 'Printed sleeves', 'BEE — Collection 01']
    },
    {
      id: 'still-here-brown',
      name: 'Still Here Tee — Chocolate Brown',
      category: 'T-shirts',
      color: 'Chocolate Brown',
      price: null,
      compareAt: null,
      status: 'coming-soon',
      images: ['images/merch/brown-front.webp', 'images/merch/brown-back.webp', 'images/merch/brown-lookbook.webp'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      desc: 'Some journeys are fought in silence. Some stories are worn, not told. Chocolate brown heavyweight streetwear with a moonlit wanderer across the back.',
      details: ['Heavyweight fabric', 'Oversized fit', 'Small chest print, full back artwork', 'BEE — Collection 01']
    }
  ]
};
