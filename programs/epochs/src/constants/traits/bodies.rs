type Pixel = (u8, u8, u8);
type Epoch = [[Pixel; 32]; 32];
const DARK: Epoch = [
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
    [(255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (028, 028, 028), (028, 028, 028), (255, 000, 246), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (028, 028, 028), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246), (255, 000, 246)],
];

pub const BODY_GROUP: [Epoch; 1] = [DARK];