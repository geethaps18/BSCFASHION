// /data/categories.ts

export type SubCategory = {
  id: string;
  name: string;
  image: string;
  subCategories: SubCategory[];
};

// Helper to generate unique IDs
let idCounter = 1;
function genId() {
  return (idCounter++).toString();
}

export const categories: SubCategory[] = [
  {
    id: genId(),
    name: "Men",
    image: "/images/men.png",
    subCategories: [
      { id: genId(), name: "Shirts", image: "/images/shirt.png", subCategories: [
          { id: genId(), name: "Formal Shirts", image: "/images/formal-shirt.png", subCategories: [] },
          { id: genId(), name: "Casual Shirts", image: "/images/casual-shirt.png", subCategories: [] },
          { id: genId(), name: "Printed Shirts", image: "/images/printed-shirt.png", subCategories: [] },
          { id: genId(), name: "Denim Shirts", image: "/images/denim-shirt.png", subCategories: [] },
          { id: genId(), name: "Linen Shirts", image: "/images/linen-shirt.png", subCategories: [] },
        ], },
      { id: genId(), name: "T-Shirts", image: "/images/tshirt.png", subCategories: [
          { id: genId(), name: "Polo T-Shirts", image: "/images/polo.png", subCategories: [] },
          { id: genId(), name: "Round Neck T-Shirts", image: "/images/round.png", subCategories: [] },
          { id: genId(), name: "Oversized T-Shirts", image: "/images/oversized.png", subCategories: [] },
          { id: genId(), name: "Graphic T-Shirts", image: "/images/graphic.png", subCategories: [] },
          { id: genId(), name: "V-Neck T-Shirts", image: "/images/v-neck.png", subCategories: [] },] },
      { id: genId(), name: "Jeans", image: "/images/jeans.png", subCategories: [
        { id: genId(), name: "Slim Fit Jeans", image: "/images/slimfit-jeans.png", subCategories: [] },
          { id: genId(), name: "Regular Fit Jeans", image: "/images/regeularfit-jeans.png", subCategories: [] },
          { id: genId(), name: "Tapered Jeans", image: "/images/tapered-jeans.png", subCategories: [] },
          { id: genId(), name: "Distressed Jeans", image: "/images/distressed-jeans.png", subCategories: [] },
      ] },
      { id: genId(), name: "Hoodies", image: "/images/hoodies.png", subCategories: []},
      { id: genId(), name: "Jackets", image: "/images/jackt.png", subCategories: []},
      { id: genId(), name: "Trousers", image: "/images/trousers.png", subCategories: [
        { id: genId(), name: "Formal Trousers", image: "/images/formal-trouser.png", subCategories: [] },
          { id: genId(), name: "Chinos", image: "/images/chinos.png", subCategories: [] },
          { id: genId(), name: "Cargo Pants", image: "/images/cargo-pant.png", subCategories: [] },
          { id: genId(), name: "Joggers", image: "/images/jogger.png", subCategories: [] },
      ] },
      { id: genId(), name: "Ethnic Wear", image: "/images/ethnic-men.png", subCategories: [
        { id: genId(), name: "Kurtas", image: "/images/kurtha-men.png", subCategories: [] },
          { id: genId(), name: "Kurta Pyjama Sets", image: "/images/pyjama-set.png", subCategories: [] },
          { id: genId(), name: "Sherwanis", image: "/images/sherwanis.png", subCategories: [] },
          { id: genId(), name: "Nehru Jackets", image: "/images/nehru.png", subCategories: [] },
          { id: genId(), name: "Indo-Westren Wear", image: "/images/indo.png", subCategories: [] },
      ] },
      { id: genId(), name: "Shorts", image: "/images/short-men.png", subCategories: []},
    ],
  },
  {
    id: genId(),
    name: "Saree",
    image: "/images/saree.png",
    subCategories: [
      { id: genId(), name: "Fancy Sarees", image: "/images/fancy-saree.png", subCategories: [] },
      {
        id: genId(),
        name: "Silk Sarees",
        image: "/images/silk-saree.png",
        subCategories: [
          { id: genId(), name: "Art Silk", image: "/images/art-silk-saree.png", subCategories: [] },
          { id: genId(), name: "Semi Silk", image: "/images/semi-silk.png", subCategories: [] },
          { id: genId(), name: "Kanchipuram Pure Silk", image: "/images/kanchipuram.png", subCategories: [] },
          { id: genId(), name: "Pure Crepe Silk", image: "/images/crepe-silk.png", subCategories: [] },
          { id: genId(), name: "Soft Silk", image: "/images/soft-silk.png", subCategories: [] },
        ],
      },
      { id: genId(), name: "Designer Sarees", image: "/images/designer-saree.png", subCategories: [] },
      { id: genId(), name: "Cotton Sarees", image: "/images/cotton-saree.png", subCategories: [] },
    ],
  },
  {
    id: genId(),
    name: "Ethnic",
    image: "/images/ethnic.png",
    subCategories: [
      { id: genId(), name: "Kurtis", image: "/images/kurti.png", subCategories: [] },
      { id: genId(), name: "Kurtha Set", image: "/images/kurtaset-woem.png", subCategories: []},
      { id: genId(), name: "Dupatta Sets", image: "/images/duppata-set.png", subCategories: [] },
      { id: genId(), name: "Dress Materials", image: "/images/dress-meterials.png", subCategories: [] },
      { id: genId(), name: "Lehengas", image: "/images/lehenga.png", subCategories: [] },
      { id: genId(), name: "Blouses", image: "/images/blouses.png", subCategories: [] },
      { id: genId(), name: "Bottom Wear", image: "/images/bottom.png", subCategories: [
        { id: genId(), name: "Palazzos", image: "/images/palazzos.png", subCategories: [] },
        { id: genId(), name: "Skirts", image: "/images/Skirt.png", subCategories: [] },
        { id: genId(), name: "Leggings", image: "/images/leggings.png", subCategories: [] },
      ] },
    ],
  },
  {
    id: genId(),
    name: "Western",
    image: "/images/western.png",
    subCategories: [
      { id: genId(), name: "Dresses", image: "/images/dress.png", subCategories: [
      { id: genId(), name: "Bodycon", image: "/images/bodycon.png", subCategories: [] },
      { id: genId(), name: "A-Line", image: "/images/aline.png", subCategories: [] },
      { id: genId(), name: "Maxi", image: "/images/maxi.png", subCategories: [] },
      { id: genId(), name: "Mini", image: "/images/mini.png", subCategories: [] },
      ] },
      { id: genId(), name: "Jumpsuits", image: "/images/jumpsuit.png", subCategories: [] },
      { id: genId(), name: "Tops", image: "/images/top.png", subCategories: [
      { id: genId(), name: "Crop Tops", image: "/images/crop-top.png", subCategories: [] },
      { id: genId(), name: "Tank Tops", image: "/images/tank-top.png", subCategories: [] },
      { id: genId(), name: "Long Tops", image: "/images/long.png", subCategories: [] },
      { id: genId(), name: "Full Sleeves Tops", image: "/images/full.png", subCategories: [] },
      ] },
      { id: genId(), name: "T-Shirts", image: "/images/tshirt-w.png", subCategories: [] },
      { id: genId(), name: "Jeans & Jeggings", image: "/images/jeans-w.png", subCategories: [
      { id: genId(), name: "Skinny Fit", image: "/images/skinny.png", subCategories: [] },
      { id: genId(), name: "High Rice Jeans", image: "/images/highrice.png", subCategories: [] },
      { id: genId(), name: "Straight Fit", image: "/images/straight.png", subCategories: [] },
      { id: genId(), name: "Jeggings", image: "/images/jeggings.png", subCategories: [] },
      ] },
      { id: genId(), name: "Skirts & Trousers", image: "/images/skirt.png", subCategories: [] },
    ],
  },
  {
    id: genId(),
    name: "Kids",
    image: "/images/kids.png",
    subCategories: [
      { id: genId(), name: "Boys", image: "/images/boys.png", subCategories: [
      { id: genId(), name: "Co-Sets", image: "/images/coset-boy.png", subCategories: [] },
      { id: genId(), name: "Ethnic", image: "/images/ethnic-boys.png", subCategories: [] },
      { id: genId(), name: "T-Shirts", image: "/images/tshirt-boy.png", subCategories: [] },
      { id: genId(), name: "Shirts", image: "/images/shirtboy.png", subCategories: [] },
      { id: genId(), name: "Pants", image: "/images/pants-boy.png", subCategories: [] },
      { id: genId(), name: "Shorts", image: "/images/shorts.png", subCategories: [] },
      { id: genId(), name: "Nightsuits", image: "/images/nightboy.png", subCategories: [] },
      { id: genId(), name: "Inner Wear", image: "/images/inwear-boys.png", subCategories: [] },
      ] },
      { id: genId(), name: "Girls", image: "/images/girls.png", subCategories: [
      { id: genId(), name: "Co-Sets", image: "/images/coset-girl.png", subCategories: [] },
      { id: genId(), name: "Ethnic", image: "/images/ethnic-girls.png", subCategories: [] },
      { id: genId(), name: "Frocks", image: "/images/frock.png", subCategories: [] },
      { id: genId(), name: "Top & Tunics", image: "/images/ttgirl.png", subCategories: [] },
      { id: genId(), name: "Pants", image: "/images/pant-girls.png", subCategories: [] },
      { id: genId(), name: "Shorts", image: "/images/shorts-girl.png", subCategories: [] },
      { id: genId(), name: "Nightsuits", image: "/images/nightgirl.png", subCategories: [] },
      { id: genId(), name: "Inner Wear", image: "/images/inwear-girls.png", subCategories: [] },
      ] },
      { id: genId(), name: "Toys", image: "/images/toys.png", subCategories: [
        { id: genId(), name: "Educational Toys", image: "/images/educational-toy.png", subCategories: [] },
      { id: genId(), name: "Soft Toys", image: "/images/soft-toy.png", subCategories: [] },
      { id: genId(), name: "Board Games", image: "/images/board-game.png", subCategories: [] },
      ] },
      { id: genId(), name: "Footwear", image: "/images/footwear.png", subCategories: [] },
      { id: genId(), name: "Kids Accessories", image: "/images/kids-a.png", subCategories: [] },
    ],
  },
  {
    id: genId(),
    name: "Groom Collections",
    image: "/images/groom.png",
    subCategories: [
      { id: genId(), name: "Sherwanis", image: "/images/sherwani.png", subCategories: [] },
      { id: genId(), name: "Blazers & Suits", image: "/images/blazer.png", subCategories: [] },
      { id: genId(), name: "Wedding Kurtas", image: "/images/kurtas-g.png", subCategories: [] },
      { id: genId(), name: "Indo-Wetern", image: "/images/indo-west.png", subCategories: [] },
      { id: genId(), name: "Wedding Footwear", image: "/images/shoes.png", subCategories: [] },
    ],
  },
  {
    id: genId(),
    name: "Bridal Collections",
    image: "/images/bridal.png",
    subCategories: [
      { id: genId(), name: "Bridal Sarees", image: "/images/silk-saree.png", subCategories: [] },
      { id: genId(), name: "Bridal Lehengas", image: "/images/lehenga.png", subCategories: [] },
      { id: genId(), name: "Gowns", image: "/images/gown.png", subCategories: [] },
      { id: genId(), name: "Wedding Kurtas", image: "/images/kurtas.png", subCategories: [] },
      { id: genId(), name: "Bridal Veil ", image: "/images/kurtas.png", subCategories: [] },
    ],
  },
  {
    id: genId(),
    name: "Couple Wedding Collections",
    image: "/images/couple.png",
    subCategories: [
      { id: genId(), name: "Engagement Look", image: "/images/eng.png", subCategories: [] },
      { id: genId(), name: "Sangeeth Look", image: "/images/sangeet.png", subCategories: [] },
      { id: genId(), name: "Haldi Look", image: "/images/haldi.png", subCategories: [] },
      { id: genId(), name: "Mehendi Look", image: "/images/mehandi.png", subCategories: [] },
      { id: genId(), name: "Muhurtham Look", image: "/images/muhurtham.png", subCategories: [] },
      { id: genId(), name: "Reception Look", image: "/images/reception.png", subCategories: [] },
      
    ],
  },
  {
    id: genId(),
    name: "Home",
    image: "/images/home.png",
    subCategories: [
      { id: genId(), name: "Bedsheets", image: "/images/bedsheet.png", subCategories: [] },
      { id: genId(), name: "Comforters", image: "/images/com.png", subCategories: [] },
      { id: genId(), name: "Curtains", image: "/images/curt.png", subCategories: [] },
      { id: genId(), name: "Bath & Towels", image: "/images/bath.png", subCategories: [] },
    ],
  },
  {
    id: genId(),
    name: "Jewellery",
    image: "/images/jewellery.png",
    subCategories: [
      { id: genId(), name: "Earrings", image: "/images/earring.png", subCategories: [] },
      { id: genId(), name: "Necklaces", image: "/images/necklace.png", subCategories: [] },
      { id: genId(), name: "Rings & Bangles", image: "/images/rings.png", subCategories: [] },
      { id: genId(), name: "Jewellery Sets", image: "/images/jewellery-set.png", subCategories: [] },
    ],
  },
];
