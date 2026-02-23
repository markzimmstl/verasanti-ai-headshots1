import { BrandData } from '../types.ts';

export const BRAND_DEFINITIONS: Record<string, BrandData> = {
  Corporate: {
    label: 'Corporate & Business',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Black Pantsuit Sharp – black tailored pantsuit, silk blouse, pointed-toe heels',
          'Navy Skirt Suit – navy skirt suit, cream blouse, pearls, classic pumps',
          'Modern Power Suit – charcoal pantsuit, bold blouse, sleek heels',
          'Executive Sheath Dress – fitted navy sheath dress, matching blazer, nude heels',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Charcoal Suit Classic – charcoal suit, white shirt, navy tie, black leather shoes',
          'Navy Power Suit – navy pinstripe suit, French cuff shirt, burgundy tie, dark oxfords',
          'Business Casual Blazer – gray blazer, white shirt, no tie, khakis, brown loafers',
          'Executive Sharkskin – light gray sharkskin suit, pale blue shirt, cognac dress shoes',
        ],
      },
      {
        category: 'Neutral / Unisex Styles',
        items: [
          'Crisp White Shirt – white button shirt, gray trousers, black dress shoes',
          'Modern Blazer Look – navy blazer, white shirt, slim trousers, leather loafers',
          'Professional Polo – fitted white polo, chinos, clean white sneakers',
          'Tailored Vest – gray vest, white shirt, trousers, dress shoes',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'modern-office',
        name: 'Modern Glass Office',
        prompt:
          'in a modern high‑rise corporate office with floor‑to‑ceiling glass walls, desks, and computers in soft blur; this is clearly an office interior, not a hospital, podcast studio, or photography backdrop',
        iconType: 'building',
      },
      {
        id: 'boardroom',
        name: 'Executive Boardroom',
        prompt:
          'standing confidently in an executive boardroom with a long mahogany table, office chairs, and a presentation screen; this is a corporate meeting room, not a hospital, logistics hub, or camera studio',
        iconType: 'briefcase',
      },
      {
        id: 'keynote-stage',
        name: 'Keynote Speaker Stage',
        prompt:
          'speaking on a large business conference stage with branded screens and a blurred audience; this is a corporate event venue, not a podcast booth or photo studio backdrop',
        iconType: 'mic',
      },
      {
        id: 'ted-talk',
        name: 'TED-Style Stage',
        prompt:
          'standing on a round red carpet dot on a dark stage with a large projection screen behind, TED‑talk style; this must look like a conference theatre, not a photography studio set',
        iconType: 'mic',
      },
      {
        id: 'executive-lounge',
        name: 'Executive Lounge',
        prompt:
          'sitting in a high‑end airport executive lounge or private business club with leather armchairs and soft ambient lighting; this is a travel/business lounge, not a hospital lobby or neutral headshot backdrop',
        iconType: 'coffee',
      },
      {
        id: 'awards-ceremony',
        name: 'Awards Ceremony',
        prompt:
          'at a black‑tie business awards gala with warm bokeh event lights and guests in formalwear in the background; clearly an event space, not an office cubicle or hospital',
        iconType: 'sparkles',
      },
      {
        id: 'glass-bridge',
        name: 'Corporate Skybridge',
        prompt:
          'standing on a glass skybridge connecting two office towers, with office interiors and city architecture visible; this is an office complex, not a healthcare building or studio set',
        iconType: 'building',
      },
      {
        id: 'city-skyline',
        name: 'City Skyline Balcony',
        prompt:
          'on a high‑floor balcony with an impressive blurred city skyline behind; a corporate penthouse or office tower terrace, not a studio background',
        iconType: 'building',
      },
      {
        id: 'solid-studio',
        name: 'Neutral Headshot Studio',
        prompt:
          'in a professional corporate headshot studio with a clean grey gradient backdrop and softbox lighting; a simple studio look (only this Corporate Look should use this exact neutral studio background)',
        iconType: 'camera',
      },
    ],
  },

  Wellness: {
    label: 'Wellness & Fitness',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Yoga Flow – cropped sports bra, fitted leggings, bare feet',
          'Fitness Influencer – sports bra, high-waist leggings, trendy sneakers',
          'Wellness Studio – layered studio wrap, yoga pants, yoga socks',
          'Alternative Products Expert – ethereal yoga wear, loose linen pants, simple sandals',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Yoga Instructor – fitted tank top, yoga pants, bare feet',
          'Trainer Performance – athletic polo, athletic shorts, cross-training sneakers',
          'Wellness Coach – hoodie, joggers, stylish sneakers',
          'Health Products Expert – performance compression top, athletic shorts, running shoes',
        ],
      },
      {
        category: 'Neutral / Unisex Styles',
        items: [
          'Studio Instructor – fitted athletic tee, leggings, athletic shoes',
          'Wellness Casual – hoodie, joggers, lifestyle sneakers',
          'Fitness Pro – performance polo, athletic pants, trainers',
          'Group Class – solid tank, workout pants, gym shoes',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'yoga-studio',
        name: 'Yoga Studio',
        prompt:
          'in a bright, airy yoga studio with hardwood floors, natural light, and yoga mats; clearly a wellness studio, not a gym or corporate office',
        iconType: 'sparkles',
      },
      {
        id: 'fitness-gym',
        name: 'Modern Gym',
        prompt:
          'in a clean, modern fitness gym with equipment, mirrors, and motivational branding in soft blur; unmistakably a fitness center, not an office or medical clinic',
        iconType: 'building',
      },
      {
        id: 'outdoor-wellness',
        name: 'Outdoor Park / Trail',
        prompt:
          'outdoors on a scenic park path or trail with lush greenery and natural light; a healthy outdoor setting, not an urban street or industrial yard',
        iconType: 'leaf',
      },
      {
        id: 'wellness-studio',
        name: 'Wellness Coaching Studio',
        prompt:
          'in a warmly lit wellness coaching studio with plants, natural textures, and calming decor; a holistic health space, not a corporate office or hospital',
        iconType: 'heart',
      },
      {
        id: 'rooftop-fitness',
        name: 'Rooftop / Outdoor Gym',
        prompt:
          'on a rooftop or open-air fitness space with city or nature views in the background; an energetic outdoor fitness setting, not a studio backdrop',
        iconType: 'building',
      },
    ],
  },

  RealEstate: {
    label: 'Real Estate & Property',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Realtor Power Dress – fitted blazer dress, gold accessories, high heels',
          'Open House Chic – cream blazer, black pants, stylish flats',
          'Luxury Listing – wrap dress, statement necklace, strappy heels',
          'Showing Ready – tailored trousers, silk shell top, pointed flats',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Top Producer Blazer – navy blazer, white shirt, no tie, dark chinos, brown leather boots',
          'Luxury Agent Suit – charcoal suit, open collar shirt, black loafers',
          'Field Agent Casual – sport coat, patterned shirt, dark wash denim, Chelsea boots',
          'Broker Professional – gray suit, conservative tie, polished oxfords',
        ],
      },
      {
        category: 'Neutral / Unisex Styles',
        items: [
          'Modern Realtor – white shirt, slim trousers, blazer, loafers',
          'Professional Casual – polo shirt, khakis, leather sneakers',
          'Approachable Agent – button shirt, dark jeans, casual boots',
          'Listing Pro – crisp collared shirt, neutral pants, dress shoes',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'luxury-home',
        name: 'Luxury Living Room',
        prompt:
          'inside a modern luxury home living room with staged furniture, large windows, and a fireplace; clearly a residential interior, not a corporate office or hospital lobby',
        iconType: 'building',
      },
      {
        id: 'suburban-street',
        name: 'Suburban Street',
        prompt:
          'standing on a pleasant sunlit suburban street with upscale houses and front yards; this is a residential neighborhood, not a city office district or industrial site',
        iconType: 'building',
      },
      {
        id: 'modern-arch',
        name: 'Modern Architecture',
        prompt:
          'in front of a striking modern residential or mixed‑use building with glass and clean lines; real estate architecture, not a hospital or logistics warehouse',
        iconType: 'building',
      },
      {
        id: 'bright-office',
        name: 'Realtor Office',
        prompt:
          'in a bright real estate office with property photos, maps, and miniature house models in the background; clearly a realtor environment, not a generic corporate office or clinic',
        iconType: 'briefcase',
      },
      {
        id: 'open-house',
        name: 'Open House Sign',
        prompt:
          'standing confidently in front of a blurred luxury home with an open house sign; clearly a real estate setting, not a photography studio backdrop',
        iconType: 'building',
      },
    ],
  },

  Healthcare: {
    label: 'Healthcare & Medical',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Doctor Lab Coat – white lab coat, V-neck blouse, slacks, professional flats',
          'Nurse Scrubs – teal scrubs, minimal earrings, athletic sneakers',
          'Medical Admin – blouse, trousers, lab coat, comfortable flats',
          'Therapist Professional – cardigan, slacks, loafers',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Physician Lab Coat – white lab coat, dress shirt, slacks, leather shoes',
          'Surgeon Scrubs – navy scrubs, stethoscope, athletic medical shoes',
          'Clinic Manager – polo shirt, khakis, comfortable loafers',
          'Dentist Professional – lab coat, collared shirt, trousers, non-slip shoes',
        ],
      },
      {
        category: 'Neutral / Unisex Styles',
        items: [
          'Clinical White – lab coat, neutral scrubs, stethoscope, white medical shoes',
          'Medical Polo – solid polo, khaki pants, clean sneakers',
          'Healthcare Casual – button shirt, neutral trousers, loafers',
          'Clinic Professional – collared shirt, dark pants, dress shoes',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'clinic-hall',
        name: 'Modern Clinic',
        prompt:
          'in a bright, clean modern medical clinic hallway with exam room doors, subtle signage, and medical details; this must read as a healthcare environment, not a corporate office corridor or studio',
        iconType: 'building',
      },
      {
        id: 'hospital-lobby',
        name: 'Hospital Lobby',
        prompt:
          'in a professional hospital lobby with reception desk, wayfinding signs, and patients in soft blur; clearly a hospital, not an airport lounge or office lobby',
        iconType: 'building',
      },
      {
        id: 'consult-room',
        name: 'Consultation Room',
        prompt:
          'in a private medical consultation room with exam table, medical equipment, and diplomas on the wall; obviously a doctor\'s office, not a boardroom or podcast studio',
        iconType: 'briefcase',
      },
      {
        id: 'clean-studio',
        name: 'Medical Studio',
        prompt:
          'in a bright white studio background styled like a medical headshot: very clean, clinical feel, subtle medical props only; this studio look is specific to healthcare and should not resemble a generic portrait studio',
        iconType: 'camera',
      },
    ],
  },

  CreativeDesigner: {
    label: 'Creative & Designer',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Art Director – colorful blouse, wide-leg pants, platform heels',
          'UX Designer – wrap top, cropped trousers, stylish mules',
          'Photographer Studio – black mock neck, slim jeans, leather ankle boots',
          'Graphic Designer – statement blouse, midi skirt, designer flats',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Creative Director – patterned blazer, black tee, slim denim, leather boots',
          'Web Designer – slim blazer, chambray shirt, dark trousers, clean sneakers',
          'Photographer/Videographer – loose statement shirt, dark jeans, rugged boots',
          'Interior Designer – linen shirt, chinos, suede loafers',
        ],
      },
      {
        category: 'Neutral / Unisex Styles',
        items: [
          'Studio Creative – black tee, slim jeans, high-top sneakers',
          'Designer Casual – chambray shirt, neutral pants, loafers',
          'Artsy Professional – patterned shirt, dark trousers, desert boots',
          'Creative Field – henley, dark jeans, work boots',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'creative-studio',
        name: 'Creative Studio Backdrop',
        prompt:
          'in a softly lit creative studio with shelves of cameras, lenses, art books, and props in the background; clearly a creative workspace, not a corporate office or hospital',
        iconType: 'camera',
      },
      {
        id: 'creative-brick-loft',
        name: 'Loft with Brick Wall',
        prompt:
          'in a loft‑style space with exposed brick wall, simple plants, and a clean, modern desk in soft natural light; an artist/creator loft, not a corporate office or medical clinic',
        iconType: 'building',
      },
      {
        id: 'creative-photo-set',
        name: 'Photo Set Background',
        prompt:
          'on a minimal photography set with seamless paper backdrop and light stands softly out of focus; this is a creative photo studio, distinct from corporate or medical studio backgrounds',
        iconType: 'camera',
      },
      {
        id: 'creative-edit-suite',
        name: 'Edit / Studio Desk',
        prompt:
          'at a simple creative workspace with a large monitor, drawing tablet, and clean desk, background blurred; clearly a designer/editor desk, not a corporate cubicle',
        iconType: 'monitor',
      },
      {
        id: 'creative-gallery-wall',
        name: 'Gallery Wall',
        prompt:
          'in front of a softly lit gallery‑style wall with framed photos or designs, neutral tones and subtle depth of field; a creative exhibition feel, not an office or hospital hallway',
        iconType: 'sparkles',
      },
      {
        id: 'creative-urban',
        name: 'Urban Creative Vibe',
        prompt:
          'in an outdoor urban setting with murals or textured walls in soft focus, flattering overcast light, subtle arts‑district atmosphere; clearly a creative neighborhood, not a generic city street or industrial yard',
        iconType: 'building',
      },
    ],
  },

  CreatorBrand: {
    label: 'Creator & Personal Brand',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Content Creator – fitted top, high-waist jeans, ankle boots',
          'Vlogger Bright – colorful blouse, skirt, stylish flats',
          'Membership Owner – wrap dress, bold earrings, heels',
          'TikTok Star – trend-forward knit top, statement pants, chunky sneakers',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'YouTube Ready – solid premium tee, dark jeans, trendy sneakers',
          'Podcast Host – button shirt, casual blazer, chinos, loafers',
          'Course Creator – polo, chinos, leather sneakers',
          'Influencer Pop – graphic tee, slim pants, designer sneakers',
        ],
      },
      {
        category: 'Neutral / Unisex Styles',
        items: [
          'Thumbnail Ready – solid vibrant tee, dark pants, clean sneakers',
          'Video Call Pro – collared shirt, neutral bottoms, loafers',
          'Social Media Pop – solid vibrant tee, slim jeans, trendy sneakers',
          'Creator Casual – henley, dark trousers, boots',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'podcast-studio',
        name: 'Podcast Studio',
        prompt:
          'speaking into a high‑end microphone in a dedicated podcast studio with acoustic foam panels and warm colored lighting; this is an audio studio, not a corporate keynote stage or medical setting',
        iconType: 'mic',
      },
      {
        id: 'creator-desk',
        name: 'Creator Desk Setup',
        prompt:
          'at a well-lit content creator desk with a ring light, microphone, large monitor, and a clean aesthetic; clearly a home studio or creator workspace, not a corporate office',
        iconType: 'monitor',
      },
      {
        id: 'coworking',
        name: 'Co-working Space',
        prompt:
          'in a vibrant modern co‑working space with open desks, laptops, and a creative atmosphere; a relaxed professional setting, not a formal boardroom',
        iconType: 'building',
      },
      {
        id: 'creator-urban',
        name: 'Urban Lifestyle Setting',
        prompt:
          'in a trendy urban neighborhood with cafés, murals, or street art in soft focus; a lifestyle creator vibe, not a corporate plaza or industrial yard',
        iconType: 'building',
      },
      {
        id: 'creator-stage',
        name: 'Conference / Speaker Stage',
        prompt:
          'on a modern conference or event stage with branded screens and a live audience in soft blur; a personal brand speaking moment, not a formal corporate keynote',
        iconType: 'mic',
      },
    ],
  },

  LocalService: {
    label: 'Local Service Pro',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Hair Stylist – black stylist apron over blouse, slim pants, comfortable flats',
          'Salon Manager – blouse, trousers, stylish loafers',
          'Nail Tech – fun printed top, dark pants, clean sneakers',
          'Spa Owner – flowy blouse, wide pants, sandals',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Salon Owner – high-end button shirt, dark jeans, fashionable boots',
          'Barber – fitted black tee, work pants, sturdy sneakers',
          'Stylist Professional – statement collared shirt, dark pants, leather shoes',
          'Shop Owner – button-up shirt, neutral pants, casual shoes',
        ],
      },
      {
        category: 'Neutral / Unisex Styles',
        items: [
          'Service Business – polo, khakis, work shoes',
          'Local Pro – collared shirt, work pants, boots',
          'Shop Professional – button shirt, neutral bottoms, loafers',
          'Trade Service – quarter-zip pullover, work pants, utility boots',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'salon-interior',
        name: 'Salon Interior',
        prompt:
          'inside a modern, upscale hair salon with styling chairs, mirrors, and product shelves in soft blur; clearly a beauty salon, not a corporate office or medical clinic',
        iconType: 'sparkles',
      },
      {
        id: 'boutique-shop',
        name: 'Boutique / Shop Front',
        prompt:
          'in front of or inside a stylish local boutique or small business storefront with clean branding and window displays; clearly a local retail setting, not a warehouse or office tower',
        iconType: 'building',
      },
      {
        id: 'community-space',
        name: 'Community Center / Studio',
        prompt:
          'in a welcoming community studio or service space with warm lighting, branded signage, and a friendly atmosphere; a local business environment, not a corporate boardroom',
        iconType: 'heart',
      },
      {
        id: 'outdoor-local',
        name: 'Local Neighborhood Street',
        prompt:
          'on a friendly, walkable neighborhood commercial street with local businesses and storefronts in soft blur; a small business community feel, not a downtown corporate district',
        iconType: 'building',
      },
    ],
  },

  Industrial: {
    label: 'Industrial & Logistics',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Logistics Coordinator – polo shirt, work pants, comfortable sneakers',
          'Warehouse Lead – tee, cargo pants, work boots',
          'Field Service – work shirt, sturdy pants, utility boots',
          'Operations Manager – blouse, neutral trousers, professional flats',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Warehouse Supervisor – solid polo, work pants, safety boots',
          'Driver Professional – solid utility shirt, cargo pants, sturdy shoes',
          'Factory Tech – safety vest over work shirt, work pants, steel-toe boots',
          'Plant Manager – collared shirt, khakis, leather work shoes',
        ],
      },
      {
        category: 'Neutral / Unisex Styles',
        items: [
          'Industrial Pro – polo, cargo pants, work boots',
          'Warehouse Standard – solid utility shirt, work pants, sneakers',
          'Field Operations – safety vest over collared shirt, cargo pants, boots',
          'Logistics Team – performance polo, neutral pants, clean work shoes',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'factory-floor',
        name: 'Smart Factory',
        prompt:
          'on a clean, high‑tech factory floor with industrial machines and robots; clearly a manufacturing environment, not an office, studio, or hospital',
        iconType: 'factory',
      },
      {
        id: 'blueprint-table',
        name: 'Blueprint Table',
        prompt:
          'leaning over a table with blueprints and tools in a bright industrial workspace; this is an engineering or construction office, not a corporate boardroom',
        iconType: 'briefcase',
      },
      {
        id: 'construction-site',
        name: 'Construction Site',
        prompt:
          'on a construction site with cranes, scaffolding, and partially built structures; clearly outdoors industrial, not a city sidewalk or hospital',
        iconType: 'building',
      },
      {
        id: 'solar-farm',
        name: 'Green Energy Field',
        prompt:
          'standing firmly on a gravel maintenance path between rows of solar panels in a solar farm, realistic perspective with feet on the ground; clearly an energy installation, not an office or studio',
        iconType: 'sun',
      },
    ],
  },
};
