import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Cluster, PublicKey, clusterApiUrl } from "@solana/web3.js";

export const cluster: Cluster = process.env.NEXT_PUBLIC_CLUSTER as Cluster || 'devnet';
export const endpoint: string = process.env.NEXT_PUBLIC_URL || clusterApiUrl(WalletAdapterNetwork.Devnet);
//export const endpoint: string = 'http://127.0.0.1:8899';

export const TRAITS_TYPE_INDEX = 1;

export const TRAIT_MAP_HATS = [
    "Abstract", "Ape", "Aardvark", "Bagpipe", "Bag", "Banana", "Bank", "Baseball Game", "Basketball",
    "Bat", "Bell", "Beet", "Bigfoot Yeti", "Beer", "Bigfoot", "Bomb", "Blackhole", "Blueberry",
    "Bonsai", "Boombox", "Boot", "Brain", "Bear", "Bubble Speech", "Boxing Glove", "Burger Dollarmenu",
    "Bubblegum", "Cake", "Cash Register", "Box", "Calculator", "Calendar", "Car", "Canned Ham",
    "Cassette Tape", "Chain", "Chainsaw", "Chameleon", "Camcorder", "Cd", "Cheese", "Chef Hat",
    "Chart Bars", "Cherry", "Chicken", "Chilli", "Chips", "Chocolate", "Clutch", "Chipboard", "Cat",
    "Clover", "Console Handheld", "Coffee Bean", "Cloud", "Cone", "Cookie", "Cordless Phone",
    "Crab", "Cow", "Crane", "Cotton Ball", "Crt Bsod", "Croc Hat", "Diamond Blue", "Crystal Ball",
    "Dictionary", "Dino", "Diamond Red", "Dog", "Doughnut", "Dna", "Crown", "Drill", "Duck", "Ducky",
    "Earth", "Egg", "Factory Dark", "Faberge", "Fan", "Film 35mm", "Film Strip", "Flamingo", "Fire Hydrant",
    "Fence", "Flower", "Fir", "Fox", "Gavel", "Garlic", "Glasses Big", "Gnome", "Frog", "Ghost B", "Goat",
    "Hair", "Goldcoin", "Hardhat", "Helicopter", "Heart", "Highheel", "Horse Deepfried", "Hotdog", "House",
    "Hockey Puck", "Goldfish", "Grouper", "Igloo", "Icepop B", "Island", "Jellyfish", "Jupiter", "Kangaroo",
    "Laptop", "Lint", "Lightning Bolt", "Lips", "Ketchup", "Lipstick2", "Mailbox", "Macaroni", "Lock",
    "Mirror", "Maze", "Milk", "Mixer", "Mountain Snowcap", "Moon", "Microwave", "Mosquito", "Moose", "Mouse",
    "Mug", "Mushroom", "Noodles", "Mustard", "Nigiri", "Onion", "Orangutan", "Orca", "Outlet", "Otter",
    "Oyster", "Owl", "Paintbrush", "Panda", "Peanut", "Paperclip", "Pickle", "Peyote", "Piano", "Pill",
    "Pie", "Piggybank", "Pineapple", "Pencil Tip", "Pillow", "Pirateship", "Pizza", "Plane", "Pipe", "Pop",
    "Potato", "Pufferfish", "Pumpkin", "Porkbao", "Queen Crown", "Rabbit", "Rainbow", "Rangefinder",
    "Raven", "Retainer", "Pyramid", "Ring", "Robot", "Road", "Rgb", "Ruler Triangular", "Rock",
    "Rosebud", "Sailboat", "Saguaro", "Sandwich", "Scorpion", "Saw", "Saturn", "Shark", "Skateboard",
    "Skeleton Hat", "Shower", "Skilift", "Snowmobile", "Smile", "Snowglobe", "Stapler", "Spaghetti",
    "Squid", "Star Sparkles", "Sponge", "Steak", "Sunset", "Taco Classic", "Taxi", "Thumbsup",
    "Toiletpaper Full", "Toothbrush Fresh", "Tornado", "Tooth", "Trashcan", "Toaster", "Undead", "Ufo",
    "Turing", "Unicorn", "Vent", "Volcano", "Void", "Wall", "Volleyball", "Wallet", "Wallsafe", "Wave",
    "Washingmachine", "Watermelon", "Watch", "Weed", "Weight", "Whale", "Werewolf", "Wine", "Zebra",
    "Wizard Hat", "Whale Alive", "Couch", "Hanger", "Index Card", "Snowman", "Treasurechest",
    "Vending Machine", "Wine Barrel", "Capybara", "Backpack", "Beluga", "Cotton Candy", "Beanie",
    "Curling Stone", "Satellite", "Fax Machine", "Tiger"
];

export const TRAIT_MAP_BODIES: string[] = [
    "Dark"
];

export const TRAIT_MAP_SHIRTS = [
    "X1n", "Belly Chameleon", "Bling Anvil", "Bling Anchor", "Aardvark", "Axe", "Bird Side",
    "Bird Flying", "Bling Arrow", "Bling Cheese", "Bling Love", "Bling Scissors", "Body Gradient Dusk",
    "Bling Rings", "Bling Sparkles", "Bling Mask", "Bling Gold Ingot", "Body Gradient Checkerdisco",
    "Body Gradient Dawn", "Body Gradient Ice", "Body Gradient Pride", "Checker Rgb", "Body Gradient Redpink",
    "Carrot", "Body Gradient Glacier", "Chain Logo", "Body Gradient Sunset", "Checker Bigwalk Greylight",
    "Checker Bigwalk Blue Prime", "Checkers Big Red Cold", "Checker Vibrant", "Checker Spaced Black",
    "Checker Spaced White", "Checkers Black", "Checker Bigwalk Rainbow", "Checkers Magenta 80",
    "Checkers Big Green", "Checkers Blue", "Cloud", "Chicken", "Clover", "Collar Sunset", "Decay Gray Dark",
    "Decay Pride", "Cow", "Dollar Bling", "Ducky", "Dinosaur", "Eth", "Eye", "Flash", "Fries", "Dragon",
    "Glasses Logo Sun", "Grid Simple Bege", "Glasses", "Id", "Heart", "Infinity", "Insignia", "Leaf",
    "Hoodiestrings Uneven", "Lines 45 Rose", "Glasses Logo", "Lightbulb", "Lines 45 Greens", "Marsface",
    "None", "Lp", "Moon Block", "Rain", "Matrix White", "Pizza Bling", "Pocket Pencil", "Oldshirt",
    "Rainbow Steps", "Rgb", "Shirt Black", "Secret X", "Snowflake", "Shrimp", "Stains Zombie",
    "Scarf Clown", "Slimesplat", "Small Bling", "Stripes And Checks", "Stains Blood", "Stripes Blit",
    "Stripes Brown", "Robot", "Stripes Blue Med", "Sunset", "Stripes Red Cold", "Taxi Checkers", "Tee Yo",
    "Think", "Stripes Olive", "Tie Black On White", "Txt A2b2", "Tie Dye", "Txt Cc", "Text Yolo",
    "Txt Foo Black", "Tie Red", "Txt Doom", "Txt Dao Black", "Txt Lmao", "Txt Cc2", "Txt Io", "Txt Lol",
    "Tie Purple On White", "Txt Nil Grey Dark", "Txt Ico", "Txt Dope Text", "Txt Copy", "Safety Vest",
    "Txt Noun Green", "Stripes Big Red", "Txt Noun F0f", "Txt Pi", "Txt Pop", "Txt Rofl", "Txt We",
    "Txt Noun", "Wall", "Wave", "Wet Money", "Txt Yay", "Txt Mint", "Yingyang", "Woolweave Dirt",
    "Txt Noun Multicolor", "Woolweave Bicolor", "Grease", "Tatewaku", "Uroko", "Broken Heart", "Sweater"
];

export const TRAITS_MAP_GLASSES = [
    "Hi Rose", "Black Eyes Red", "Black Rgb", "Black", "Blue Med Saturated",
    "Blue", "Frog Green", "Full Black", "Green Blue Multi", "Grey Light",
    "Guava", "Honey", "Magenta", "Orange", "Pink Purple Multi",
    "Red", "Smoke", "Teal", "Watermelon", "Yellow Orange Multi",
    "Yellow Saturated", "Deep Teal", "Grass", "Eclipse"
];
