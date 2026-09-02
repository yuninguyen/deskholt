import type { Dictionary } from './en';

export const vi = {
  header: {
    title: 'Quản trị Deskholt', localeLabel: 'Ngôn ngữ', themeLabel: 'Chuyển giao diện sáng/tối', lightAction: 'Sáng', darkAction: 'Tối',
  },
  login: { title: 'Quản trị Deskholt', prompt: 'Nhập mật khẩu quản trị để tiếp tục.', invalidPassword: 'Sai mật khẩu. Vui lòng thử lại.', password: 'Mật khẩu', submit: 'Đăng nhập' },
  products: {
    title: 'Bàn đứng — Quản trị', description: 'Quản lý xuất bản sản phẩm và khả năng hiển thị trên công cụ tìm kiếm.', newProduct: 'Sản phẩm mới', downloadBackup: 'Tải bản sao lưu (JSON)',
    saved: 'Đã lưu thành công. Sản phẩm bị ảnh hưởng được làm nổi bật bên dưới.', publishingRejected: 'Thao tác xuất bản bị từ chối.',
    table: { product: 'Sản phẩm', lifecycle: 'Vòng đời', index: 'Chỉ mục', attributes: 'Thuộc tính', actions: 'Thao tác' },
    lifecycle: { DRAFT: 'Bản nháp', ACTIVE: 'Hoạt động', BLOCKED: 'Bị chặn', ARCHIVED: 'Đã lưu trữ' },
    access: { eligible: 'Đủ điều kiện hiển thị công khai và lập chỉ mục', explicitNoindex: 'Công khai, không lập chỉ mục', draft: 'Bản nháp—chưa công khai', blocked: 'Bị chặn—chưa công khai', archived: 'Đã lưu trữ—chưa công khai' },
    index: { enabled: 'Đã bật', disabled: 'Đã tắt', enable: 'Bật chỉ mục', disable: 'Tắt chỉ mục', enableHelp: 'Đặt vòng đời thành Hoạt động để bật lập chỉ mục.' },
    actions: { save: 'Lưu', edit: 'Sửa', editSpecifications: 'Sửa thông số', offers: 'Ưu đãi' }, empty: 'Chưa có sản phẩm Bàn đứng.',
    errors: { invalidInput: 'Yêu cầu xuất bản không hợp lệ. Kiểm tra lại giá trị Sản phẩm và lệnh rồi thử lại.', missing: 'Không tìm thấy sản phẩm. Làm mới danh sách trước khi thử lệnh xuất bản khác.', activeOnly: 'Đặt vòng đời thành Hoạt động trước khi bật lập chỉ mục.', concurrencyConflict: 'Sản phẩm đã thay đổi khi lệnh đang chạy. Kiểm tra trạng thái hiện tại rồi thử lại.', fallback: 'Không thể hoàn tất thao tác xuất bản. Kiểm tra trạng thái Sản phẩm rồi thử lại.' },
  },
  createProduct: {
    back: 'Sản phẩm', title: 'Tạo sản phẩm', description: 'Tạo thông tin nhận diện Sản phẩm, rồi tiếp tục đến thông số.', rejected: 'Tạo sản phẩm bị từ chối.', name: 'Tên', slug: 'Slug', slugHelp: 'Chỉ dùng chữ thường, chữ số và dấu gạch nối.', category: 'Danh mục', selectCategory: 'Chọn danh mục', brandName: 'Tên thương hiệu', optional: 'không bắt buộc', descriptionLabel: 'Mô tả', imageUrl: 'URL hình ảnh', upcSku: 'UPC/SKU', sustainable: 'Sản phẩm bền vững', submit: 'Tạo sản phẩm',
    errors: { invalidInput: 'Kiểm tra các trường Sản phẩm bắt buộc rồi thử lại.', categoryMissing: 'Danh mục đã chọn không còn tồn tại. Làm mới và chọn danh mục khác.', slugTaken: 'Slug Sản phẩm này đã được dùng. Chọn slug khác.', fallback: 'Không thể tạo Sản phẩm. Kiểm tra biểu mẫu rồi thử lại.' },
  },
  editProduct: {
    back: 'Sản phẩm', title: 'Sửa sản phẩm', submit: 'Lưu thay đổi',
    name: 'Tên', slug: 'Slug', slugLockedHelp: 'Chỉ có thể thay đổi slug khi Sản phẩm ở trạng thái Bản nháp.',
    brandName: 'Tên thương hiệu', optional: 'không bắt buộc', descriptionLabel: 'Mô tả', imageUrl: 'URL hình ảnh',
    upcSku: 'UPC/SKU', sustainable: 'Sản phẩm bền vững', saved: 'Đã cập nhật sản phẩm thành công.',
    errors: {
      invalidInput: 'Kiểm tra các trường Sản phẩm bắt buộc rồi thử lại.',
      notFound: 'Không tìm thấy Sản phẩm. Hãy làm mới danh sách rồi thử lại.',
      slugTaken: 'Slug Sản phẩm này đã được dùng. Chọn slug khác.',
      slugLocked: 'Chỉ có thể thay đổi slug khi Sản phẩm ở trạng thái Bản nháp.',
      fallback: 'Không thể cập nhật Sản phẩm. Kiểm tra biểu mẫu rồi thử lại.',
    },
  },
  specifications: {
    categoryUnavailable: 'Danh mục của sản phẩm này chưa được khai báo trong Attribute Engine — chưa có thuộc tính nào để nhập.', back: 'Sản phẩm', completeness: 'Mức độ hoàn chỉnh', saved: 'Đã lưu thông số thành công.', errors: { rowsInvalid: 'dòng có lỗi, chưa lưu được — vui lòng sửa và lưu lại.', staleEnum: 'Giá trị ENUM đã lưu không còn nằm trong danh sách cho phép. Chọn giá trị mới trước khi lưu.' }, derived: 'Suy luận', true: 'Đúng', false: 'Sai', emptyOption: '—', staleEnumSuffix: 'giá trị đã lưu — không còn được phép', sourceUrl: 'URL nguồn', sourceType: 'Loại nguồn', productLevel: 'Cấp sản phẩm', noProductAttributes: 'Không có thuộc tính cấp sản phẩm.', noVariants: 'Sản phẩm này chưa có Biến thể. Hãy tạo Biến thể trước để nhập thông số cấp Biến thể.', noActiveVariants: 'Sản phẩm này không có Biến thể đang hoạt động. Hãy tạo hoặc kích hoạt Biến thể trước để nhập thông số cấp Biến thể.', variant: 'Biến thể', submit: 'Lưu thông số',
    sourceTypes: { MANUFACTURER: 'Nhà sản xuất', MANUAL: 'Hướng dẫn', RETAILER: 'Nhà bán lẻ', CERTIFICATION: 'Chứng nhận', OTHER: 'Khác' }, confidences: { VERIFIED: 'Đã xác minh', LIKELY: 'Có khả năng', UNVERIFIED: 'Chưa xác minh' },
  },
  offers: {
    back: 'Sản phẩm', title: 'Ưu đãi', addOffer: 'Thêm ưu đãi', save: 'Lưu',
    network: 'Mạng lưới', price: 'Giá', rawUrl: 'URL sản phẩm', inStock: 'Còn hàng',
    priorityOrder: 'Ưu tiên', inStockBadge: 'Còn hàng', outOfStockBadge: 'Hết hàng',
    saved: 'Đã lưu ưu đãi thành công.', selectNetwork: 'Chọn một mạng lưới',
    networks: { amazon: 'Amazon', walmart: 'Walmart', target: 'Target', awin: 'Awin', impact: 'Impact', cj: 'CJ' },
    empty: 'Chưa có ưu đãi nào cho sản phẩm này.',
    errors: {
      invalidInput: 'Kiểm tra các trường ưu đãi (mạng lưới, giá, URL) rồi thử lại.',
      notFound: 'Không tìm thấy ưu đãi này cho sản phẩm. Hãy làm mới và thử lại.',
      fallback: 'Không thể lưu ưu đãi. Kiểm tra biểu mẫu rồi thử lại.',
    },
  },
} as const satisfies Dictionary;
