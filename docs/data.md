# Data and sourcing

The editable sources are [`web/data/dia_diem.csv`](../web/data/dia_diem.csv) and [`web/data/gia_tham_khao.csv`](../web/data/gia_tham_khao.csv). The current dataset is a provisional District 1 and District 3 seed, not a complete city guide. Empty cells represent unknown information, not zero or a closed place; check a source before using a result for travel.

## Place columns

| Columns | Meaning |
| --- | --- |
| `id` | Unique stable identifier |
| `ten_vi`, `ten_en`, `ten_khac` | Vietnamese and English names; alternative names separated by `;` |
| `loai`, `khu` | Category (`di_tich`, `quan_an`, `ca_phe`, `diem_dem`, `trong_nha`, `giao_thong`) and `Q1` or `Q3` |
| `dia_chi`, `lat`, `lng` | Address and coordinates |
| `gio_mo` | Opening-hours grammar below; blank means unknown |
| `gia_tu`, `gia_den` | Lower and upper reference price in thousands of VND; blank means unknown |
| `mo_ta_vi`, `mo_ta_en`, `tag` | Descriptions and `;`-separated tags; `trong_nha` is an indoor tag |
| `thoi_gian_tham_quan`, `trang_thai` | Visit duration in minutes; `hoat_dong` or `dong_cua_vinh_vien` |
| `google_place_id` | Optional identifier for a Maps directions link; no Places API is required |
| `cau_chuyen_vi`, `cau_chuyen_en`, `nhin_ky_vi`, `nhin_ky_en` | Optional bilingual story and detail to look for |
| `anh_url`, `anh_nguon` | Optional image URL and attribution/source |
| `nguon`, `ngay_kiem` | Source URL and checked date (`YYYY-MM-DD`) |

## Opening hours

Separate segments with `;`. Each segment has a day or day range (`mon`–`sun` or `daily`) followed by `HH:MM-HH:MM`, comma-separated windows, or `closed`. Examples: `mon-fri 07:00-22:00; sat-sun 08:00-23:00`, `daily 17:00-02:00`, `sun closed`. An end time at or before the start crosses midnight. Times are interpreted in Vietnam time (UTC+7). A blank value returns unknown opening status.

## Price columns

`id`, `hang_muc` (item), `ten_khac` (semicolon-separated alternative names), `don_vi` (unit), `gia_tu`, `gia_den`, `meo_vi`, `meo_en`, `nguon`, and `ngay_kiem`. Prices are thousands of VND. An item without both bounds is not used as a price reference.

## Update and validate

1. Verify each fact against an appropriate primary or rights-cleared source. Record the source URL and date checked; leave unverified hours, prices, stories and images blank.
2. Edit the relevant CSV in `web/data/`, retaining all columns and stable IDs. If using a spreadsheet, export UTF-8 CSV with the same headers.
3. Run `cd web && pnpm build-data`, then `pnpm test` and `pnpm build`. Review the generated changes under `web/lib/data/generated/` and the affected cards before committing.
4. For a correction, include the source and date in a pull request or use the data correction issue template.

The build checks required headers and values, allowed categories and status, valid source URLs and dates, unique IDs, coordinates within the demo bounds, valid hours, nonnegative prices and ordered price ranges. It also requires a positive visit duration. The `predev`, `pretest` and `prebuild` scripts regenerate JSON from CSV; do not edit generated JSON by hand.

Use material the project has permission to publish and credit images. Do not copy Google Maps/Places hours, prices, photos or reviews into this dataset; the optional place ID is used for a directions link. The product does not infer an unknown price or opening time from an empty cell.
