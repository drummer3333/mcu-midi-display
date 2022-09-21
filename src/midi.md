f0 -
 0  | Header
 0  |
66  |
14 - 
12 type 
 0 fader
61 -
62  | 
63  | 
20  | 
20  | text
20  | 
20  | 
f7 - 

f0 0 0 66 14 12 0 61 62 63 20 20 20 20 f7 - abc    
f0 0 0 66 14 12 7 64 65 66 20 20 20 20 f7 - def    
f0 0 0 66 14 12 e 61 62 63 20 20 20 20 f7 - abc    
f0 0 0 66 14 12 0 64 65 66 20 20 20 20 f7 - def
f0 0 0 66 14 12 0 64 65 66 20 20 20 20 f7 - def

type:
- 12 LCD
    fader: 
    start 0 inc 7

- 72 LCD Color
    8 byte: all color per channel
 0 Black
 1 Red
 2 Green
 3 Yellow
 4 Blue
 5 Magenta
 6 Cyan
 7 White



Should be
0xf0, 0x00, 0x00, 0x66, 0xii, 0x20, 0xXX, 0xYY, 0xf7
 ii = Hardware System Exclusive ID 
 0x10 = Logic Control 
 0x11 = Logic Control XT 
 0x14 = Mackie Control 
 0x15 = Mackie Control Extender 
 XX = Channel Being addressed (0x00 to 0x07) 
YY = Meter control byte where 
 bit 0 = Signal Present LED Enable (1 = Signal present LED’s enabled; 0 = disabled) 
 bit 1 = LCD Meter Enable (1 = LCD Meter visible; 0 = LCD Meter disabled) 
 bit 2 = Enable peak-hold and overload info on horizontal meters
Ah wait that's just the initialization

Channel Meter Level message format: 0xd0, 0xLL
 LL = Meter Level control byte where 
 bit 0-3 = Meter Level control 
 0x0 – 0xD = Meter level 0% thru 100% (does not affect peak indicator) 
 0xE = Set peak indicator (on horizontal bar meter only) 
 0xF = Clear peak indicator (on horizontal bar meter only) 
 bit 4-6 = LCD Meter Enable (1 = LCD Meter visible; 0 = LCD Meter disabled) 
 bit 2 = Enable peak-hold and overload info on horizontal meters
