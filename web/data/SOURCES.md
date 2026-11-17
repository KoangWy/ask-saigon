# Verified source audit

Checked 2026-10-30. `nguon` in each CSV row points to its primary page. Coordinates were separately checked from OSM/Nominatim, Wikipedia page coordinates, or an official embedded map and are listed below. Nominatim lookups used a descriptive project User-Agent at no more than one request per second. All primary source URLs returned HTTP 200 except Michelin Guide pages, which returned HTTP 202 bot protection; indexed Michelin entries confirmed the named restaurants. No row was retained solely because its candidate CSV contained the value.

## Places

| ID | Primary page and status | Fields supported by primary page | Coordinate source |
|---|---|---|---|
| q1-001 | [Ben Thanh Market official market rules](https://benthanhmarket.vn/about/noi-quy-cho.html) — 200 | Market name; daily 07:00–22:00 hours; food and fresh produce vendors from 04:00. | [OSM search: Chợ Bến Thành](https://nominatim.openstreetmap.org/search?format=json&q=Ch%E1%BB%A3%20B%E1%BA%BFn%20Th%C3%A0nh%20Ho%20Chi%20Minh%20City) — 200. [Wikipedia article](https://en.wikipedia.org/wiki/B%E1%BA%BFn_Th%C3%A0nh_Market) — 200, used for the clock-tower observation in the story. |
| q1-002 | [Nguyễn Huệ Boulevard](https://en.wikipedia.org/wiki/Nguy%E1%BB%85n_Hu%E1%BB%87_Boulevard) — 200 | Street identity and Ho Chi Minh City location. | [OSM search: Nguyễn Huệ Boulevard](https://nominatim.openstreetmap.org/search?format=json&q=Nguy%E1%BB%85n%20Hu%E1%BB%87%20Boulevard%20Ho%20Chi%20Minh%20City) — 200. |
| q1-003 | [Bùi Viện Street](https://en.wikipedia.org/wiki/B%C3%B9i_Vi%E1%BB%87n_Street) — 200 | Street identity and District 1 location. | [OSM search: Bùi Viện Street](https://nominatim.openstreetmap.org/search?format=json&q=Bui%20Vien%20Street%20Ho%20Chi%20Minh%20City) — 200. |
| q3-001 | [Turtle Lake](https://en.wikipedia.org/wiki/Turtle_Lake_(Ho_Chi_Minh_City)) — 200 | Landmark name and location in Ho Chi Minh City. | [OSM search: Turtle Lake](https://nominatim.openstreetmap.org/search?format=json&q=Turtle%20Lake%20Ho%20Chi%20Minh%20City) — 200. |
| q1-004 | [Independence Palace visitor hours](https://dinhdoclap.gov.vn/en/visiting-hours/) — 200 | Official site name, address, daily 07:00–18:00 hours and adult ticket options. | [OSM search: Independence Palace](https://nominatim.openstreetmap.org/search?format=json&q=Independence%20Palace%20Ho%20Chi%20Minh%20City) — 200. |
| q1-005 | [Vietnam Tourism: 7 must-see attractions](https://vietnam.travel/things-to-do/7-must-see-attractions-hcmc/) — 200 | Post office name, address, visitor description, free admission, and daily 07:30–12:00 / 13:30–17:00 hours. | [OSM search: Saigon Central Post Office](https://nominatim.openstreetmap.org/search?format=json&q=Saigon%20Central%20Post%20Office) — 200. |
| q1-006 | [Notre-Dame Cathedral Basilica of Saigon](https://en.wikipedia.org/wiki/Notre-Dame_Cathedral_Basilica_of_Saigon) — 200 | Landmark identity, location and construction dates (1877–1880), which support its short story. | [OSM search: Notre Dame Cathedral](https://nominatim.openstreetmap.org/search?format=json&q=Notre%20Dame%20Cathedral%20Ho%20Chi%20Minh%20City) — 200. |
| q3-002 | [War Remnants Museum visitor guide](https://saigon-scene.com/war-remnants-museum/) — 200 | Museum identity, address, exhibit description, daily 07:30–17:30 hours and adult ticket price of 60,000 VND (effective October 2026). | [OSM search: War Remnants Museum](https://nominatim.openstreetmap.org/search?format=json&q=War%20Remnants%20Museum%20Ho%20Chi%20Minh%20City) — 200. |
| q1-006b | [Jade Emperor Pagoda](https://en.wikipedia.org/wiki/Jade_Emperor_Pagoda) — 200 | Pagoda identity and Ho Chi Minh City location. | [OSM search: Jade Emperor Pagoda](https://nominatim.openstreetmap.org/search?format=json&q=Jade%20Emperor%20Pagoda%20Ho%20Chi%20Minh%20City) — 200. |
| q1-007 | [Saigon Opera House](https://en.wikipedia.org/wiki/Saigon_Opera_House) — 200 | Theatre identity and location. | [OSM search: Saigon Opera House](https://nominatim.openstreetmap.org/search?format=json&q=Saigon%20Opera%20House) — 200. |
| q1-008 | [Ho Chi Minh City Museum of Fine Arts: hours and admission](https://hcmcmuseumoffinearts.wixsite.com/mysite/hours-and-admission) — 200 | Museum name, address, daily 08:00–17:00 hours and 30,000 VND adult admission. | [OSM search: Fine Arts Museum, 97A Phó Đức Chính](https://nominatim.openstreetmap.org/search?format=json&q=B%E1%BA%A3o%20t%C3%A0ng%20M%E1%BB%B9%20thu%E1%BA%ADt%20Th%C3%A0nh%20ph%E1%BB%91%20H%E1%BB%93%20Ch%C3%AD%20Minh%2097A%20Ph%C3%B3%20%C4%90%E1%BB%A9c%20Ch%C3%ADnh) — 200. |
| q1-009 | [Ho Chi Minh City Museum official site](https://hcmc-museum.edu.vn/) — 200 | Museum name, address and daily 08:00–17:00 hours. | Official site’s embedded map pin — 200; `10.7759578,106.6996391`. |
| q1-010 | [Ho Chi Minh City Hall](https://en.wikipedia.org/wiki/Ho_Chi_Minh_City_Hall) — 200 | Building identity, address and city location. | Wikipedia coordinates property — 200; `10.7765,106.7009`. |
| q1-011 | [Bitexco Financial Tower](https://en.wikipedia.org/wiki/Bitexco_Financial_Tower) — 200 | Tower identity, address and building details. | Wikipedia coordinates property — 200; `10.7716667,106.7044444`. |
| q1-012 | [Saigon Centre official site](https://shopping.saigoncentre.com.vn/) — 200 | Mall identity and its displayed daily 09:30–22:00 hours. | [OSM search: Saigon Centre](https://nominatim.openstreetmap.org/search?format=json&q=Saigon%20Centre%20Ho%20Chi%20Minh%20City) — 200. |
| q1-013 | [Hotel Continental Saigon](https://en.wikipedia.org/wiki/Hotel_Continental_Saigon) — 200 | Hotel identity, address and location. | Wikipedia coordinates property — 200; `10.7769,106.7025`. |
| q1-014 | [Rex Hotel](https://en.wikipedia.org/wiki/Rex_Hotel) — 200 | Hotel identity, address and location. | Wikipedia coordinates property — 200; `10.7758333,106.7015`. |
| q1-015 | [Saigon Zoo and Botanical Gardens](https://en.wikipedia.org/wiki/Saigon_Zoo_and_Botanical_Gardens) — 200 | Garden and zoo identity, address and location. | Wikipedia coordinates property — 200; `10.7880556,106.7047222`. |
| q1-016 | [Mariamman Temple](https://en.wikipedia.org/wiki/Mariamman_Temple,_Ho_Chi_Minh_City) — 200 | Temple identity and city location. | [OSM search: Mariamman Temple](https://nominatim.openstreetmap.org/search?format=json&q=Mariamman%20Temple%20Ho%20Chi%20Minh%20City) — 200. |
| q1-017 | [Tao Đàn Park](https://en.wikipedia.org/wiki/Tao_%C4%90%C3%A0n_Park) — 200 | Park identity, location and address. | [OSM search: Tao Đàn Park](https://nominatim.openstreetmap.org/search?format=json&q=Tao%20Dan%20Park%20Ho%20Chi%20Minh%20City) — 200. |
| q3-003 | [Tân Định Church](https://en.wikipedia.org/wiki/T%C3%A2n_%C4%90%E1%BB%8Bnh_Church) — 200 | Church identity, address and location. | [OSM search: Tân Định Church](https://nominatim.openstreetmap.org/search?format=json&q=Tan%20Dinh%20Church%20Ho%20Chi%20Minh%20City) — 200. |
| q3-004 | [Vĩnh Nghiêm Pagoda](https://en.wikipedia.org/wiki/V%C4%A9nh_Nghi%C3%AAm_Pagoda) — 200 | Pagoda identity and city location. | [OSM search: Vĩnh Nghiêm Pagoda](https://nominatim.openstreetmap.org/search?format=json&q=Vinh%20Nghiem%20Pagoda%20Ho%20Chi%20Minh%20City) — 200. |
| q3-005 | [Xá Lợi Pagoda](https://en.wikipedia.org/wiki/X%C3%A1_L%E1%BB%A3i_Pagoda) — 200 | Pagoda identity and location. | Wikipedia coordinates property — 200; `10.7780556,106.6866667`. |
| q3-006 | [Saigon Scene: best phở in Saigon](https://saigon-scene.com/best-pho-in-saigon/) — 200 | Phở Hòa Pasteur name, 260C Pasteur location and daily 07:00–22:30 hours. | [OSM search: Phở Hòa Pasteur](https://nominatim.openstreetmap.org/search?format=json&q=Pho%20Hoa%20Pasteur%20Ho%20Chi%20Minh%20City) — 200. |
| q1-018 | [Bánh Mì Huỳnh Hoa contact page](https://banhmihuynhhoa.vn/lien-he/) — 200 | Restaurant name, Lê Thị Riêng address and daily 06:00–22:00 hours. | [OSM search: Huỳnh Hoa, 26 Lê Thị Riêng](https://nominatim.openstreetmap.org/search?format=json&q=B%C3%A1nh%20m%C3%AC%20Hu%E1%BB%B3nh%20Hoa%2026%20L%C3%AA%20Th%E1%BB%8B%20Ri%C3%AAng%20Ho%20Chi%20Minh%20City) — 200. |
| q1-019 | [MICHELIN Guide: Bún Chả 145](https://guide.michelin.com/vn/en/ho-chi-minh-city-region/ho-chi-minh-city/restaurant/bun-cha-145) — 202 | Michelin indexed listing confirms restaurant identity; no hours or prices are asserted in the CSV. | [OSM search: Bún Chả 145](https://nominatim.openstreetmap.org/search?format=json&q=B%C3%BAn%20ch%E1%BA%A3%20145%20B%C3%B9i%20Vi%E1%BB%87n%20Ho%20Chi%20Minh%20City) — 200. |
| q1-020 | [MICHELIN Guide: Bánh Xèo 46A](https://guide.michelin.com/vn/en/ho-chi-minh-city-region/ho-chi-minh-city/restaurant/banh-xeo-46a) — 202 | Michelin indexed listing confirms restaurant identity; hours and venue prices are left blank. | [OSM search: Bánh Xèo 46A](https://nominatim.openstreetmap.org/search?format=json&q=B%C3%A1nh%20x%C3%A8o%2046A%20%C4%90inh%20C%C3%B4ng%20Tr%C3%A1ng%20Ho%20Chi%20Minh%20City) — 200. |
| q1-021 | [MICHELIN Guide: Bánh Cuốn Tây Hồ 127](https://guide.michelin.com/us/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/banh-cuon-tay-ho-127) — 202 | Indexed listing provides restaurant identity, address and daily 05:30–21:30 hours. | [OSM search: Bánh Cuốn Tây Hồ 127](https://nominatim.openstreetmap.org/search?format=json&q=B%C3%A1nh%20cu%E1%BB%91n%20T%C3%A2y%20H%E1%BB%93%20127%20%C4%90inh%20Ti%C3%AAn%20Ho%C3%A0ng%20Ho%20Chi%20Minh%20City) — 200. |
| q1-022 | [Miss Saigon Tours: late-night food](https://misssaigontours.com/late-night-food-saigon/) — 200 | Phở Quỳnh name, 323 Phạm Ngũ Lão address and 24-hour availability. | [OSM search: Phở Quỳnh, 323 Phạm Ngũ Lão](https://nominatim.openstreetmap.org/search?format=json&q=Ph%E1%BB%9F%20Qu%E1%BB%B3nh%20323%20Pham%20Ngu%20Lao%20Ho%20Chi%20Minh%20City) — 200. |
| q3-007 | [MICHELIN Guide: Chị Tuyền](https://guide.michelin.com/vn/en/ho-chi-minh-city-region/ho-chi-minh-city/restaurant/chi-tuyen) — 202 | Michelin indexed listing confirms restaurant identity; hours and venue prices are blank. | [OSM search: Chị Tuyền, 175 Cô Giang](https://nominatim.openstreetmap.org/search?format=json&q=B%C3%BAn%20th%E1%BB%8Bt%20n%C6%B0%E1%BB%9Bng%20Ch%E1%BB%8B%20Tuy%E1%BB%81n%20175%20C%C3%B4%20Giang) — 200. |
| q3-008 | [Go Vietnam: cà phê sữa đá in Saigon](https://govietnam.travel/en/food/ca-phe-sua-da-sai-gon/) — 200 | Cheo Leo café name, 109 Nguyễn Thiện Thuật location and its 1938 opening history. | [OSM search: Cheo Leo Cafe](https://nominatim.openstreetmap.org/search?format=json&q=Cheo%20Leo%20Cafe) — 200. |
| q1-023 | [The Workshop Coffee listing](https://www.vinaspot.com/en/v/workshop) — 200 | Business name, 27 Ngô Đức Kế address and daily 08:00–20:30 hours. | [OSM search: The Workshop Coffee](https://nominatim.openstreetmap.org/search?format=json&q=The%20Workshop%20Coffee%20Ho%20Chi%20Minh%20City) — 200. |
| q1-024 | [Vietnam Airlines: The Cafe Apartments](https://www.vietnamairlines.com/vn/en/plan-book/travel/travel-guide/the-cafe-apartment) — 200 | Building identity, 42 Nguyễn Huệ address and description as a complex of cafes and shops. Building-level hours are not asserted. | [OSM search: 42 Nguyễn Huệ](https://nominatim.openstreetmap.org/search?format=json&q=42%20Nguyen%20Hue%20Ho%20Chi%20Minh%20City) — 200. |
| q1-025 | [Bến Thành station](https://en.wikipedia.org/wiki/Ben_Thanh_station) — 200 | Station identity and its underground location by Lê Lợi Boulevard / Quách Thị Trang Square. No hours are asserted. | Wikipedia coordinates property — 200; `10.7708333,106.6977778`. |

## Reference prices

Money fields are thousands of VND unless the unit says otherwise. The bike app fare is dynamic; its price fields are populated only with the official published minimum for the English-speaking driver option. Each primary price URL returned 200.

| ID | Source — status | Supported reference |
|---|---|---|
| cyclo | [Rough Guides](https://www.roughguides.com/vietnam/ho-chi-minh-city-and-around/) — 200 | HCMC cyclo rate 70,000–100,000 VND/hour. |
| taxi | [Vinasun tariff notice (effective 14 July 2026)](https://vinasun.vn/tin-chi-tiet/vinasun-taxi-dieu-chinh-gia-cuoc-tu-ngay-14072026) — 200 | Vehicle-dependent rates from 13,500 to 18,400 VND/km. |
| ride_bike | [GrabBike English fare notice](https://www.grab.com/vn/en/blog/copy-of-grab-trien-khai-thu-nghiem-tinh-nang-dat-xe-nhom/) — 200 | Published English-speaking GrabBike minimum of 15,955 VND for first 2 km in HCMC; dynamic fare may be higher. |
| ride_car | [GrabCar official fare page](https://www.grab.com/vn/en/transport/car/) — 200 | 25,000 VND base minimum for first 2 km for 4-seat car; dynamic pricing can apply. |
| coconut | [Vietnam Tourism food budget guide](https://www.vietnamtourism.com/en/how-much-to-budget-for-food-per-day-in-vietnam) — 200 | Fresh coconut reference range 20,000–50,000 VND. |
| pho | [Vietnam Tourism food budget guide](https://www.vietnamtourism.com/en/how-much-to-budget-for-food-per-day-in-vietnam) — 200 | Street-meal bowl reference range 30,000–70,000 VND. |
| banhmi | [Vietnam Tourism food budget guide](https://www.vietnamtourism.com/en/how-much-to-budget-for-food-per-day-in-vietnam) — 200 | Bánh mì reference range 15,000–45,000 VND. |
| coffee | [Go Vietnam coffee guide](https://govietnam.travel/en/food/ca-phe-sua-da-sai-gon/) — 200 | Iced milk / local coffee reference range 12,000–35,000 VND. |
| metro | [Vietnam Government news portal](https://tphcm.chinhphu.vn/chot-gia-ve-di-tau-dien-metro-so-1-101241121125611214.htm) — 200 | Metro Line 1 single-trip fares range 6,000–20,000 VND depending on payment method and distance. |
| ticket_palace | [Independence Palace official visitor page](https://dinhdoclap.gov.vn/en/visiting-hours/) — 200 | Adult Palace-only ticket 40,000 VND; Palace plus exhibition 80,000 VND. |
| ticket_war | [War Remnants Museum visitor guide](https://saigon-scene.com/war-remnants-museum/) — 200 | Adult entry 60,000 VND as of October 2026. |
| water | [Vietnam Tourism food budget guide](https://www.vietnamtourism.com/en/how-much-to-budget-for-food-per-day-in-vietnam) — 200 | Bottled-water reference range 5,000–20,000 VND. |
| ticket_finearts | [Fine Arts Museum hours and admission](https://hcmcmuseumoffinearts.wixsite.com/mysite/hours-and-admission) — 200 | Adult admission 30,000 VND. |

## Excluded candidate records

- Phở Hà Hải Triều — excluded: OSM's matching address resolved to another business, so the candidate name and pin were not independently supported.
- Cơm tấm Huyền and Lẩu bò Tí Chuột — excluded: the supplied addresses/pages did not verify a Q1/Q3 venue; one proposed Huyền address was outside the service area.
- Hủ tiếu Nam Vang Thành Đạt — excluded: candidate site did not resolve during fetch and no exact service-area pin/source pair was verified.
- Miến gà Kỳ Đồng — excluded: restaurant has current web/Michelin references, but our location lookup did not return a reliable exact map pin.
- Bún mọc Thanh Mai — excluded: Michelin candidate page returned 202 and the location lookup did not identify an exact pin.
- McDonald's Bến Thành — excluded: the candidate Tuổi Trẻ URL redirected to the publisher homepage, so it did not verify permanent closure; the canned closed-business example remains separate.
- Cơm niêu Sài Gòn — excluded: OSM result resolved to a location outside Q1/Q3.
- Cộng Cà Phê, Đỗ Phủ Café, the night market, Saigon Saigon Rooftop Bar, The Alley and Acoustic Bar — excluded: the candidate source pages were unavailable or did not verify the exact Q1/Q3 branch and current operating details.
- Vincom Center Đồng Khởi and Diamond Plaza — excluded: the candidate pages were blocked/unavailable or did not provide a sufficiently verified coordinate/source pair for this dataset build.

## Tourism department portal (added 2026-11-17)

Pages on visithcmc.vn (run by the Ho Chi Minh City Tourism Promotion Centre under the Department of Tourism), fetched 2026-11-17, all HTTP 200. Each line in `nguon_bo_sung.csv` quotes what the page states.

| ID | Page | Statement used |
|---|---|---|
| q1-001 | [/vi/cho-ben-thanh/](https://visithcmc.vn/vi/cho-ben-thanh/) (posted 2026-10-10) | Day market 07:00–18:00, fresh produce from 04:00, night market 19:00–22:00 |
| q1-004, ticket_palace | [/vi/dinh-doc-lap/](https://visithcmc.vn/vi/dinh-doc-lap/) (posted 2026-10-10) | Open 07:00–18:00 daily; adult ticket 80,000 VND |
| q3-002, ticket_war | [/vi/bao-tang-chung-tich-chien-tranh/](https://visithcmc.vn/vi/bao-tang-chung-tich-chien-tranh/) (posted 2026-10-10) | 28 Võ Văn Tần; 7:30–17:30 every day, ticket desk closes 17:00; ticket 40,000 VND. saigon-scene.com lists 60,000 VND from 1 Oct 2026, so the price card keeps 40–60k and both sources |
| q1-008, ticket_finearts | [/vi/bao-tang-my-thuat-…/](https://visithcmc.vn/vi/bao-tang-my-thuat-thanh-pho-ho-chi-minh-ve-dep-huyen-bi-say-dam-long-nguoi/) | Monday–Sunday 8:00–17:00; adult 30,000 VND |
| q1-009 | [/vi/cac-bao-tang-noi-tieng-…/](https://visithcmc.vn/vi/cac-bao-tang-noi-tieng-nhat-o-hcm-danh-cho-nguoi-yeu-nghe-thuat/) | 65 Lý Tự Trọng; 8:00–17:00; 30,000 VND |
| q1-017 | [/vi/kham-pha-cong-vien-tao-dan-…/](https://visithcmc.vn/vi/kham-pha-cong-vien-tao-dan-oc-dao-xanh-giua-long-thanh-pho/) | Open 7:00–22:00 daily; now the primary source for its hours |
| q1-006b | [/vi/chua-ngoc-hoang-…/](https://visithcmc.vn/vi/chua-ngoc-hoang-su-linh-thieng-giua-thanh-pho-ho-chi-minh/) | 73 Mai Thị Lựu; 7:00–17:30 daily (5:00–19:00 on the 1st and 15th lunar days); now the primary source for its hours |
| q1-005, q1-010, q1-013 | [/vi/di-san-phong-cach-kien-truc-dong-duong-…/](https://visithcmc.vn/vi/di-san-phong-cach-kien-truc-dong-duong-giua-long-thanh-pho/) | Post office at 02 Công xã Paris (1886–1891); City Hall at 86 Lê Thánh Tôn; Continental at 132 Đồng Khởi (1880) |
| q1-006, q3-003 | [/vi/10-diem-tham-quan-…/](https://visithcmc.vn/vi/10-diem-tham-quan-khong-the-bo-qua-khi-den-thanh-pho-ho-chi-minh/) | Cathedral at 1 Công xã Paris (1880); Tân Định Church on Hai Bà Trưng (1876) |
| q1-002 | [/vi/pho-di-bo-nguyen-hue-…/](https://visithcmc.vn/vi/pho-di-bo-nguyen-hue-ve-dep-am-thuc-va-trai-nghiem-tai-tphcm/) | Walking street in central District 1 |
| q1-003 | [/vi/dem-bat-tan-o-trung-tam-thanh-pho/](https://visithcmc.vn/vi/dem-bat-tan-o-trung-tam-thanh-pho/) | Bùi Viện runs from early evening until dawn |
| q3-001 | [/vi/thien-duong-am-thuc-duong-pho-tai-sai-gon/](https://visithcmc.vn/vi/thien-duong-am-thuc-duong-pho-tai-sai-gon/) | Turtle Lake snack area at the Quốc Tế roundabout |
| q1-015 | [/vi/sac-mau-di-san-thanh-pho/](https://visithcmc.vn/vi/sac-mau-di-san-thanh-pho/) | Zoo with more than 160 years of history |
| q1-016 | [/vi/nhung-dia-diem-du-lich-it-nguoi-biet-…/](https://visithcmc.vn/vi/nhung-dia-diem-du-lich-it-nguoi-biet-o-tphcm-dang-can-ban-kham-pha/) | Mariamman Temple, 45 Trương Định |
| q3-006, q3-007 | [/vi/top-10-mon-an-ngon-…/](https://visithcmc.vn/vi/top-10-mon-an-ngon-ban-phai-thu-khi-den-thanh-pho-ho-chi-minh/) | Phở Hòa at 260C Pasteur; Chị Tuyền at 175C Cô Giang |
| q1-018 | [/vi/10-mon-banh-mi-…/](https://visithcmc.vn/vi/10-mon-banh-mi-phai-thuong-thuc-tai-tp-hcm/) | Huỳnh Hoa at 26 Lê Thị Riêng |
| q1-019, q1-020 | [/vi/hanh-trinh-…-michelin-nam-2025/](https://visithcmc.vn/vi/hanh-trinh-du-lich-thanh-pho-moi-va-trai-nghiem-am-thuc-theo-cam-nang-michelin-nam-2025/) | Bún chả 145 and Bánh xèo 46A among the 2025 Bib Gourmand picks |

## Added 2026-11-17

Found by three research passes and kept only when every hours, price and address value had a verbatim quote that a script found again in the downloaded page (HTML entities decoded). Coordinates come from Nominatim (bounded to the service area, one request per 1.2 s) and were kept only when OSM matched the named place or the house number; rows where OSM only knew the street were dropped (Hum Central, Bông Sung, Bún bò Huế 31, Bún bò Út Hưng, Okkio Duy Tân, Chú Long Nguyễn Huệ, Bảo tàng Biệt động). Chè Kỳ Đồng was dropped because its source could not be fetched again. The AO Show price was dropped because its only source is a site the research found unreliable elsewhere.

| ID | Name | Primary page | Fields | Coordinate source |
|---|---|---|---|---|
| q1-026 | Bảo tàng Lịch sử Thành phố Hồ Chí Minh | [www.baotanglichsutphcm.com.vn](https://www.baotanglichsutphcm.com.vn/) (chinh_thuc) | hours `tue-sun 08:00-11:30,13:00-17:00;mon closed`; price 60–60k; address | OSM object "Bảo tàng Lịch sử Thành phố Hồ Chí Minh" |
| q1-027 | Bảo tàng Tôn Đức Thắng | [baotangtonducthang.vn](https://baotangtonducthang.vn/) (chinh_thuc) | hours `tue-sun 07:30-11:30,13:00-17:00;mon closed`; address | OSM object "Bảo tàng Tôn Đức Thắng" |
| q3-009 | Bảo tàng Phụ nữ Nam Bộ | [www.baotangphunu.com](http://www.baotangphunu.com/) (chinh_thuc) | hours `daily 07:30-11:30,13:30-17:00`; address | OSM object "Bảo tàng Phụ nữ Nam Bộ" |
| q1-028 | Bảo tàng Chiến dịch Hồ Chí Minh | [visithcmc.vn](https://visithcmc.vn/vi/cac-bao-tang-noi-tieng-nhat-o-hcm-danh-cho-nguoi-yeu-nghe-thuat/) (chinh_thuc) | hours `mon-fri 07:30-11:00,13:30-16:30;sat-sun closed`; price 0–0k; address | OSM object "Bảo tàng Chiến dịch Hồ Chí Minh", 2 Lê Duẩn |
| q1-029 | Nhà hát Múa rối nước Rồng Vàng | [localvietnam.com](https://localvietnam.com/ho-chi-minh-city/water-puppet-show-in-ho-chi-minh-city/) (tham_khao) | hours `daily 18:30-19:20`; price 300–350k; address | OSM object "Nhà Hát Múa Rối Nước Rồng Vàng", 55B Nguyễn Thị Minh Khai |
| q1-030 | Chợ đêm Bến Thành | [visithcmc.vn](https://visithcmc.vn/vi/cho-ben-thanh/) (chinh_thuc) | hours `daily 19:00-22:00`; address | OSM street Phan Bội Châu beside the market (the night market runs on the side streets) |
| q1-031 | Chợ đêm Tân Định | [visithcmc.vn](https://visithcmc.vn/vi/kham-pha-nhung-khu-cho-dem-noi-tieng-tai-thanh-pho-ho-chi-minh/) (chinh_thuc) | hours `daily 17:00-01:00`; address | OSM object "Chợ Tân Định" |
| q1-032 | Bến tàu Saigon Waterbus Bạch Đằng | [saigonwaterbus.com](https://saigonwaterbus.com/water-bus) (doanh_nghiep) | price 15–15k; address | OSM object "Bến tàu Bạch Đằng" |
| q3-010 | Social Club Rooftop Bar | [www.hoteldesartssaigon.com](https://www.hoteldesartssaigon.com/dining/social-club-rooftop-bar/) (doanh_nghiep) | hours `mon-thu 15:00-00:00;fri-sat 15:00-01:00;sun 15:00-00:00`; address | OSM object "Khách Sạn Hotel Des Arts Saigon" |
| q1-033 | Trung tâm thương mại Vincom Center Đồng Khởi | [vincom.com.vn](https://vincom.com.vn/vi/tttm/vincom-center-dong-khoi) (doanh_nghiep) | hours `daily 10:00-22:00`; address | OSM object "Vincom Center Đồng Khởi", 72 Lê Thánh Tôn |
| q1-034 | Đường sách Nguyễn Văn Bình | [www.nomadotravel.app](https://www.nomadotravel.app/vi/attractions/ho-chi-minh-city-book-street) (tham_khao) | hours `daily 08:00-22:00`; price 0–0k; address | OSM object "Đường Sách", Nguyễn Văn Bình |
| q1-035 | Saigon Saigon Rooftop Bar | [www.caravellehotel.com](https://www.caravellehotel.com/saigon-saigon-bar/) (doanh_nghiep) | address | OSM object "Khách sạn Caravelle Saigon" |
| q1-036 | Cộng Cà Phê Lý Tự Trọng | [congcaphe.com](https://congcaphe.com/stores) (doanh_nghiep) | hours `daily 07:00-23:00`; price 40–69k; address | congcaphe.com store data (lat/long) |
| q3-011 | Cộng Cà Phê Hồ Con Rùa | [congcaphe.com](https://congcaphe.com/stores) (doanh_nghiep) | hours `daily 07:00-22:00`; price 40–69k; address | congcaphe.com store data (lat/long) |
| q1-037 | Okkio Caffe Đồng Khởi | [okkiocaffe.com](https://okkiocaffe.com) (doanh_nghiep) | hours `daily 07:30-22:00`; address | OSM address node 151 Đồng Khởi |
| q1-038 | L'Usine Saigon Centre | [lusinespace.com](https://lusinespace.com/locations/) (doanh_nghiep) | hours `daily 10:00-21:30`; address | Same building as q1-012 Saigon Centre |
| q3-012 | Cà Phê Muối Chú Long Hồ Con Rùa | [caphemuoichulong.com](http://caphemuoichulong.com/6b-cong-truong-quoc-te-ho-con-rua-phuong-xuan-hoa-tp-ho-chi-minh) (doanh_nghiep) | hours `daily 05:00-22:00`; price 15–20k; address | OSM address node 6B Công trường Quốc Tế |
| q1-039 | Starbucks New World | [www.starbucks.vn](https://www.starbucks.vn/store-locator) (doanh_nghiep) | hours `daily 06:30-00:00`; address | starbucks.vn store-locator data |
| q1-040 | Ốc Đào | [www.timeout.com](https://www.timeout.com/vietnam/restaurants/oc-dao) (tham_khao) | hours `daily 11:00-22:15`; address | Time Out page data |
| q3-013 | Chay Garden Võ Văn Tần | [chaygarden.com](https://chaygarden.com/) (doanh_nghiep) | hours `daily 10:30-22:00`; price 79–355k; address | Time Out page data |
| q1-041 | Nhà hàng chay Phương Mai | [www.vietnamairlines.com](https://www.vietnamairlines.com/vn/en/plan-book/travel/travel-guide/vegan-restaurant-in-ho-chi-minh) (tham_khao) | hours `daily 09:00-21:30`; price 60–190k; address | OSM object "Phuong Mai Vegetarian", hẻm 82 Võ Thị Sáu |
| q1-042 | Xôi gà Number One | [www.gillespudlowski.com](https://www.gillespudlowski.com/419524/restaurants/saigon-streetfood-face-au-marche) (tham_khao) | hours `daily 06:30-20:30`; price 20–40k; address | OSM object "Xôi Gà Number One" |
| q1-043 | Cơm Tấm Mộc | [www.vietnamairlines.com](https://www.vietnamairlines.com/vn/en/plan-book/travel/travel-guide/best-broken-rice-ho-chi-minh) (tham_khao) | hours `daily 09:00-20:30`; price 40–50k; address | OSM object "Quán Cơm Tâm Mộc", Lý Tự Trọng |
| q3-014 | Hủ tiếu Nam Vang Hồng Phát | [gtrip.vn](https://gtrip.vn/travel-blogs/saigon-noodles) (tham_khao) | hours `daily 06:30-22:30`; address | OSM object "Hủ Tiếu Hồng Phát", Võ Văn Tần |
| q1-044 | Bánh canh cua 87 | [gtrip.vn](https://gtrip.vn/travel-blogs/saigon-noodles) (tham_khao) | hours `daily 11:00-21:00`; price 50–100k; address | OSM object "Bánh Canh Cua 87", 87 Trần Khắc Chân |
| q1-045 | Bún riêu Gánh | [gtrip.vn](https://gtrip.vn/travel-blogs/saigon-noodles) (tham_khao) | hours `daily 07:00-19:00`; price 60–65k; address | OSM object "Bún riêu ganh", Lê Thánh Tôn |
| q1-046 | Xe chè Lâm Vĩnh Mậu | [e.vnexpress.net](https://e.vnexpress.net/news/food-recipes/saigons-favorite-late-night-bites-4685846.html) (tham_khao) | hours `daily 19:00-00:00`; price 20–45k; address | OSM object "Chè Lâm Vinh Mậu", Nguyễn Thái Bình |
| q1-047 | Lẩu bò Tí Chuột | [mia.vn](https://mia.vn/cam-nang-du-lich/an-dem-sai-gon-12779) (tham_khao) | hours `daily 11:00-03:30`; price 35–88k; address | OSM object "Lâu Bò Tí Chuột", 1-3 Cống Quỳnh / Cao Bá Nhạ |

Hours added to existing places: q1-002 Nguyễn Huệ and q3-001 Hồ Con Rùa open 24 hours and free (travel guides, `tham_khao`); q1-011 Bitexco carries the Saigon Skydeck hours 09:30–21:30 and 240k ticket (tower site, `doanh_nghiep`); q1-015 Thảo Cầm Viên 07:00–18:30, 60k (saigonzoo.vn, `chinh_thuc`); q1-016 Mariamman 09:00–20:00, free (Vietnam Airlines guide, mia.vn). Bùi Viện stays without hours: visithcmc.vn only says it runs from early evening to dawn. Nhà thờ Đức Bà stays without hours: it is under restoration until about the end of 2027 and open only for Mass.

### Reference prices added

| ID | Range (k VND) | Source |
|---|---|---|
| ticket_war | 40–60 / person | [visithcmc.vn](https://visithcmc.vn/vi/bao-tang-chung-tich-chien-tranh/) (chinh_thuc) |
| waterbus | 15–15 / trip | [saigonwaterbus.com](https://saigonwaterbus.com/water-bus) (doanh_nghiep) |
| ticket_zoo | 60–60 / ticket | [saigonzoo.vn](https://saigonzoo.vn/ve-tham-quan) (chinh_thuc) |
| ticket_skydeck | 200–240 / ticket | [www.bitexcofinancialtower.com](http://www.bitexcofinancialtower.com/?page_id=1434) (doanh_nghiep) |
| ticket_history | 60–60 / ticket | [www.baotanglichsutphcm.com.vn](https://www.baotanglichsutphcm.com.vn/ban-tin/thong-bao-thay-doi-muc-phi-tham-quan-bao-tang) (chinh_thuc) |
| ticket_water_puppet | 300–350 / ticket | [localvietnam.com](https://localvietnam.com/ho-chi-minh-city/water-puppet-show-in-ho-chi-minh-city/) (tham_khao) |
| bus | 0–0 / trip | [buyttphcm.com.vn](https://buyttphcm.com.vn/Home/ArtMID/546/ArticleID/5059/H%c6%a0N-40-TRI%e1%bb%86U-L%c6%af%e1%bb%a2T-H192NH-KH193CH-%c4%90I-XE-BU221T-MI%e1%bb%84N-PH205-SAU-G%e1%ba%a6N-4-TH193NG-TRI%e1%bb%82N-KHAI) (chinh_thuc) |
| comtam | 35–70 / plate | [www.vietnamtourism.com](https://www.vietnamtourism.com/en/how-much-to-budget-for-food-per-day-in-vietnam) (tham_khao) |
| hutieu | 30–90 / bowl | [www.vietnamtourism.com](https://www.vietnamtourism.com/vi/an-hu-tieu-o-sai-gon-10-quan-nguoi-ia-phuong-tin-tuong) (tham_khao) |
| nuocmia | 10–20 / cup | [www.vietnamtourism.com](https://www.vietnamtourism.com/en/sugarcane-juice-and-sinh-to-vietnam-s-street-drinks-and-which-ones-are-safe) (tham_khao) |
| banhxeo | 25–50 / pancake | [www.vietnamtourism.com](https://www.vietnamtourism.com/en/banh-xeo-how-to-eat-vietnam-s-sizzling-pancake-like-a-local) (tham_khao) |
| goicuon | 10–20 / roll | [www.vietnamtourism.com](https://www.vietnamtourism.com/en/spring-rolls-in-vietnam-goi-cuon-vs-nem-the-real-difference) (tham_khao) |
| beer_buivien | 15–80 / glass or bottle | [www.vietnamtourism.com](https://www.vietnamtourism.com/en/bui-vien-street-ho-chi-minh-city-hours-prices-safety) (tham_khao) |
| food_tour | 850–2132 / person | [xotours.vn](https://xotours.vn/?page_id=13) (doanh_nghiep) |
| bun_rieu | 30–50 / bowl | [www.vietnamairlines.com](https://www.vietnamairlines.com/vn/en/plan-book/travel/travel-guide/vietnam-meal-cost) (tham_khao) |
| che | 15–35 / cup | [www.vietnamairlines.com](https://www.vietnamairlines.com/vn/en/plan-book/travel/travel-guide/vietnam-meal-cost) (tham_khao) |

Food and drink ranges from vietnamtourism.com are third-party guides (the site is not the national tourism authority, whose domain is vietnamtourism.gov.vn); they are labelled `tham_khao`. Bún bò was left out because its range was for Huế. Free city buses: 134 routes since 01/07/2026 per buyttphcm.com.vn (24/10/2026).

## Updated 2026-11-17 (afternoon)

**q1-006 Nhà thờ Đức Bà Sài Gòn → `tam_dong`.** Under major restoration, expected to finish at the end of 2027 ([Tuổi Trẻ tag page](https://tuoitre.vn/trung-tu-nha-tho.html): "dự kiến công trình đại trùng tu nhà thờ Đức Bà Sài Gòn hoàn thành cuối năm 2027"; the crosses went back on the spires on 19/03/2026). Visitors cannot go inside, only people attending Mass ([Vinwonders](https://vinwonders.com/vi/wonderpedia/news/nha-tho-duc-ba-sai-gon/): "trong giai đoạn trùng tu, nhà thờ Đức Bà không đón khách tham quan nhưng vẫn mở cửa để giáo dân đến tham dự Thánh lễ hàng ngày"; [Nomado, 21/04/2026](https://www.nomadotravel.app/vi/attractions/notre-dame-cathedral-saigon): "Nhà thờ không cho phép khách tham quan vào bên trong. Chỉ những người Công giáo đến dự Thánh lễ mới được vào."). Seeing it from outside is free; the metro route keeps it as a stop viewed from the square.

**Museum fees from 01/10/2026.** Resolution 29/2026/NQ-HĐND (27/08/2026) sets 60,000 VND per visit for the War Remnants Museum, the Fine Arts Museum, the Museum of Ho Chi Minh City and the History Museum, free for children and students; the Tôn Đức Thắng Museum and the Southern Women's Museum charge no fee yet. Sources: [HCMC Press Centre, 30/09/2026](https://ttbc-hcm.gov.vn/tp-hcm-mien-ve-tham-quan-bao-tang-cho-hoc-sinh-sinh-vien-tu-1-10-1022256.html), [HĐND TP.HCM](https://hdnd.hochiminhcity.gov.vn/tin-tuc/ban-van-hoa-xa-hoi/tu-tam-ve-tham-quan-den-nguon-luc-bao-ton-va-nang-tam-bao-tang-thanh-pho), [Museum of HCMC notice, 28/09/2026](https://hcmc-museum.edu.vn/luu-tru/5482). `ticket_war` and `ticket_finearts` moved to 60k with the press centre as primary source; `ticket_city_museum` was added. The visithcmc.vn and museum pages that still list 40,000 / 30,000 VND stay as source lines, marked as the price before 01/10/2026.
