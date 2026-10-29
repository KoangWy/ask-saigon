# Three-minute judge walkthrough

Use the local or deployed app with `/chat?offline=1&now=12:05` for the chat portion. Offline mode still needs the app server, but it does not call the model provider. Demo data is provisional and sample media and the fallback itinerary are illustrative; times, prices and availability should be checked before visiting.

| Step | English | Tiếng Việt |
| --- | --- | --- |
| 1 | Open the landing page. Introduce Ask Saigon as a local travel chat, then select **Try it for yourself**. | Mở trang giới thiệu. Giới thiệu Ask Saigon là trợ lý du lịch địa phương, rồi chọn **Dùng thử ngay**. |
| 2 | In chat, select **Paste a sample TikTok link**. Show the sample result, matched place and source. | Trong khung chat, chọn **Dán liên kết TikTok mẫu**. Giới thiệu kết quả mẫu, địa điểm khớp và nguồn. |
| 3 | Select **Translate a sample menu**. Show the translated items and, if a Vietnamese voice is available, play an ordering phrase. | Chọn **Dịch thực đơn mẫu**. Giới thiệu các món được dịch và, nếu có giọng tiếng Việt, phát câu gọi món. |
| 4 | Select **Is 300k for a cyclo ride fair?** Show the reference range, verdict, source and checked date. | Chọn câu hỏi về **300k đi xích lô**. Giới thiệu khoảng giá tham khảo, đánh giá, nguồn và ngày kiểm tra. |
| 5 | Select **Nearby**. Show place cards around the default Bến Thành demo location. | Chọn **Gần đây**. Giới thiệu các thẻ địa điểm quanh vị trí Bến Thành mặc định. |
| 6 | Select **Plan my day…** and open the itinerary sheet. Explain that travel times and the sample fallback are illustrative. | Chọn **Lên lịch một ngày…** và mở bảng lịch trình. Giải thích rằng thời gian di chuyển và lịch mẫu dự phòng chỉ mang tính minh họa. |
| 7 | Open **Simulated → Rain**, compare before and after, then select **Accept**. Depending on available verified hours, the replan can remove stops rather than provide replacements. | Mở **Giả lập → Trời mưa**, so sánh trước và sau, rồi chọn **Chấp nhận**. Tùy dữ liệu giờ mở cửa đã kiểm, lịch mới có thể bỏ điểm mà không có điểm thay thế. |
| 8 | Open **For business**. Show the example API documentation and illustrative demand dashboard; explain these business features are roadmap concepts. | Mở **Dành cho doanh nghiệp**. Giới thiệu tài liệu API mẫu và bảng nhu cầu minh họa; giải thích đây là các ý tưởng trong lộ trình. |

The interface toggle changes UI labels. Some current canned response content is English even when Vietnamese is selected. See the [data guide](data.md) for the status of the seed and [README](../README.md) for setup.
