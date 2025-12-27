import { BrandData } from '../types.ts';

export const BRAND_DEFINITIONS: Record<string, BrandData> = {
  Corporate: {
    label: 'Corporate & Executive',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Business Suit',
          'Professional Sheath Dress',
          'Modern Blazer & Blouse',
          'Tweed Jacket',
          'Elegant Office Wear',
          'Feminine Power Suit',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Classic Navy Suit',
          'Charcoal Suit & Tie',
          'Modern Blazer & Chinos',
          'Executive 3-Piece Suit',
          'Business Formal',
          'Power Suit',
          'Executive Tweed Jacket',
        ],
      },
      {
        category: 'Neutral / Unisex',
        items: [
          'Crisp White Shirt',
          'Professional Turtleneck',
          'Smart Casual Blazer',
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

  Tech: {
    label: 'Tech & Startup',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Smart Casual Blouse',
          'Tech Company Tee (Fitted)',
          'Modern Minimalist',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Startup Hoodie & Jeans',
          'Button-down & Vest',
          'Tech CEO Casual',
        ],
      },
      {
        category: 'Neutral / Unisex',
        items: [
          'Minimalist Tech Wear',
          'Smart Casual Shirt',
          'Startup Casual',
          'Tech Company T-Shirt',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'coworking',
        name: 'Co-working Space',
        prompt:
          'in a bustling modern co‑working space with open desks, laptops, sticky notes, and people collaborating; clearly a tech office environment, not a corporate boardroom or hospital corridor',
        iconType: 'monitor',
      },
      {
        id: 'server-room',
        name: 'Data Center / Server Room',
        prompt:
          'inside a futuristic data center with racks of servers, blue LEDs, and reflective floors; this is a technical server room, not a photography studio or hospital',
        iconType: 'monitor',
      },
      {
        id: 'podcast',
        name: 'Podcast Studio',
        prompt:
          'speaking into a high‑end microphone in a dedicated podcast studio with acoustic foam panels and warm colored lighting; this is an audio studio, not a corporate keynote stage or medical setting',
        iconType: 'mic',
      },
      {
        id: 'agile-office',
        name: 'Agile Open Office',
        prompt:
          'in a modern open‑plan tech office with whiteboards, sticky notes, standing desks, and casual seating; clearly a startup workspace, not a formal boardroom or hospital clinic',
        iconType: 'building',
      },
      {
        id: 'hackathon',
        name: 'Hackathon Environment',
        prompt:
          'in a busy hackathon scene with multiple screens, code on monitors, and teammates working late at shared tables; unmistakably a tech event, not a logistics warehouse or healthcare space',
        iconType: 'monitor',
      },
    ],
  },

  RealEstate: {
    label: 'Real Estate & Property',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Colorful Blazer',
          'Professional Dress',
          'Smart Realtor Casual',
        ],
      },
      {
        category: 'Masculine Styles',
        items: ['Suit (No Tie)', 'Sport Coat & Slacks', 'Modern Professional'],
      },
      {
        category: 'Neutral / Unisex',
        items: [
          'Professional Blazer',
          'Smart Casual',
          'Business Professional',
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
          'Fitted Lab Coat & Blouse',
          'Professional Clinic Wear',
          'Scrubs (Clean)',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Lab Coat & Tie',
          'Professional Scrubs (Navy)',
          'Clinic Formal',
        ],
      },
      {
        category: 'Neutral / Unisex',
        items: [
          'White Lab Coat',
          'Medical Scrubs (Blue/Teal)',
          'Smart Casual',
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
          'in a private medical consultation room with exam table, medical equipment, and diplomas on the wall; obviously a doctor’s office, not a boardroom or podcast studio',
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

  Transportation: {
    label: 'Transportation & Logistics',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Pilot Uniform (Fitted)',
          'Professional Travel Wear',
          'Logistics Manager Vest',
        ],
      },
      {
        category: 'Masculine Styles',
        items: ['Pilot Uniform', 'Driver Suit', 'Captain Uniform'],
      },
      {
        category: 'Neutral / Unisex',
        items: [
          'High-Vis Safety Vest (Clean)',
          'Leather Jacket',
          'Smart Travel Wear',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'private-jet',
        name: 'Private Jet Cabin',
        prompt:
          'seated comfortably in a luxury private jet cabin with leather seats, airplane windows, and overhead bins; clearly an aircraft interior, not an office, studio, or hospital',
        iconType: 'plane',
      },
      {
        id: 'luxury-car',
        name: 'Luxury Car Interior',
        prompt:
          'sitting in the driver seat of a high‑end luxury vehicle with visible steering wheel and dashboard; unmistakably inside a car, not an office or clinic',
        iconType: 'truck',
      },
      {
        id: 'logistics-hub',
        name: 'Logistics Warehouse',
        prompt:
          'standing confidently in front of a modern logistics warehouse with shipping containers, loading docks, and trucks; an industrial transport hub, not a tech office or hospital',
        iconType: 'truck',
      },
      {
        id: 'train-station',
        name: 'Modern Station',
        prompt:
          'at a sleek, modern train or metro station platform with signage and a blurred train; clearly transit infrastructure, not a photography backdrop or office',
        iconType: 'building',
      },
    ],
  },

  Industrial: {
    label: 'Industrial & Manufacturing',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: ['Fitted Work Shirt', 'Executive Site Wear', 'Safety Manager Gear'],
      },
      {
        category: 'Masculine Styles',
        items: ['Engineer Button-Up', 'Construction Gear', 'Site Manager Vest'],
      },
      {
        category: 'Neutral / Unisex',
        items: [
          'Safety Gear (Hard Hat/Vest)',
          'Smart Coveralls',
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

  NonProfit: {
    label: 'Non-Profit & Community',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Friendly Cardigan',
          'Volunteer Tee (Fitted)',
          'Smart Casual',
        ],
      },
      {
        category: 'Masculine Styles',
        items: ['Casual Button-down', 'Volunteer Tee', 'Polished Casual'],
      },
      {
        category: 'Neutral / Unisex',
        items: [
          'Branded Volunteer T-Shirt',
          'Business Casual',
          'Friendly Vest/Jacket',
          'Keep Original Clothing (From Photo)',
        ],
      },
    ],
    sceneOptions: [
      {
        id: 'community-center',
        name: 'Community Center',
        prompt:
          'in a welcoming, busy community center with diverse people, posters, and activity in the background; clearly a community space, not a corporate office or hospital',
        iconType: 'heart',
      },
      {
        id: 'fundraiser',
        name: 'Gala Event',
        prompt:
          'at a fundraising gala with soft event lighting, round tables, and guests mingling; a charity event atmosphere, not a corporate awards gala or studio',
        iconType: 'sparkles',
      },
      {
        id: 'outdoors-group',
        name: 'Community Garden',
        prompt:
          'outdoors in a community garden or park with plants, raised beds, and volunteers; clearly an outdoor community setting, not an office or industrial site',
        iconType: 'leaf',
      },
      {
        id: 'podium',
        name: 'Speaking at Podium',
        prompt:
          'speaking at a podium at a nonprofit or community event with banners or signage related to a cause; not a corporate keynote or podcast studio',
        iconType: 'mic',
      },
    ],
  },

  CreativeProfessional: {
    label: 'Creative Professional',
    clothingOptions: [
      {
        category: 'Feminine Styles',
        items: [
          'Statement Blazer & Simple Top',
          'Casual Dress with Denim Jacket',
          'Black Turtleneck & High-Waist Pants',
          'Simple Top with Bold Accessories',
        ],
      },
      {
        category: 'Masculine Styles',
        items: [
          'Black Crewneck Tee & Dark Jeans',
          'Denim Jacket over Neutral Tee',
          'Relaxed Button-down & Tapered Pants',
          'Casual Blazer with Graphic Tee',
        ],
      },
      {
        category: 'Neutral / Unisex',
        items: [
          'All-Black Creative Outfit',
          'Neutral Tee & Relaxed Trousers',
          'Overshirt over Plain Tee',
          'Minimal Monochrome Look',
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
};
