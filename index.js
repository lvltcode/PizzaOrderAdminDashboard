"use strict";
$().ready(function () {
  onPageLoading();
  $("#btn-filter-order").on("click", onBtnFilterClick);

  // 1 - Create - Thêm mới Order
  $("#btn-add-order").on("click", onBtnAddNewOrderClick);
  // Nút Tạo Order ở modal
  $("#btn-create-order").on("click", onBtnCreateOrder);

  // 3 - Update - Theo dõi/update đơn hàng
  $("#order-table").on("click", ".btn-edit", onBtnEditOrder);
  // Confirm Order
  $("#btn-confirm").on("click", onBtnConfirmClick);
  // Cancel Order
  $("#btn-cancel").on("click", onBtnCancelClick);

  // 4 - Delete - Xoá đơn hàng
  $("#order-table").on("click", ".btn-delete", onBtnDeleteOrder);
  // Sau khi hiển thị Modal để confirm việc delete, select id của nút confirm
  $("#btn-confirm-delete-order").on("click", onBtnConfirmDeleteOrderClick);

  // Nếu người dùng trong lúc thêm mới hoặc cập nhật mà nhấn cancel hoặc tắt modal thì cũng reset form
  $("#create-order-modal").on("hidden.bs.modal", function () {
    resetFormToNormal();
  });

  // Nếu người dùng trong lúc thêm mới hoặc cập nhật mà nhấn cancel hoặc tắt modal thì reset form
  $("#edit-order-modal").on("hidden.bs.modal", function () {
    resetFormToNormal();
  });

  // Nếu người dùng khi nhấn cancel ở Modal của Delete (không làm gì) thì reset modal về normal
  $("#delete-confirm-modal").on("hidden.bs.modal", function () {
    resetFormToNormal();
  });

  // Dùng Form Validation để validate các trường dữ liệu order
  $.validator.setDefaults({
    debug: true,
    success: "valid",
  });

  $.validator.addMethod(
    "strictEmail",
    function (paramEmail, element) {
      const vCheck =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return this.optional(element) || vCheck.test(paramEmail);
    },
    "Email không hợp lệ"
  );
});

// Vùng khai báo các plugins của Admin LTE để quản lý dashboard

//Initialize Select2 Elements
$(".select2").select2();

// Toast - Edit Order
$(".toastrDefaultWarning").click(function () {
  toastr.warning(`Đã Edit order thành công (trang web sẽ reload sau 3 giây)`);
});

$(".toastrDefaultSuccess").click(function () {
  toastr.success("Order was created");
});

// Toast - Delete Order
$(".toastrDefaultError").click(function () {
  toastr.error(
    `Đã xoá dữ liệu order thành công (trang web sẽ reload sau 3 giây)`
  );
});
// Hiển thị toast khi user tương tác với form để thông báo về validation
var Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
});

/*** REGION 1 - Global variables - Vùng khai báo biến, hằng số, tham số TOÀN CỤC */
const gBASE_URL_ORDERS = "http://42.115.221.44:8080/devcamp-pizza365/orders";

const gBASE_URL_DRINKS = "http://42.115.221.44:8080/devcamp-pizza365/drinks";

const gBASE_URL_VOUCHERS =
  "http://42.115.221.44:8080/devcamp-voucher-api/voucher_detail/";

var gFORM_MODE_NORMAL = "Normal";
var gFORM_MODE_INSERT = "Insert";
var gFORM_MODE_UPDATE = "Update";
var gFORM_MODE_DELETE = "Delete";

// biến toàn cục cho trạng thái của form: mặc định ban đầu là trạng thái Normal
var gFormMode = gFORM_MODE_NORMAL;

var gOrderResObj = {
  orders: [],
  filterOders: function (paranSelectedFilterData) {
    var vStatusValue = paranSelectedFilterData.status;
    var vPizzaTypeValue = paranSelectedFilterData.pizzaType;
    // console.log(paranSelectedFilterData);
    var vOrderResult = [];
    vOrderResult = this.orders.filter(function (paramOrder) {
      // console.log(paramOrder.loaiPizza);
      return (
        (paramOrder.trangThai == vStatusValue || vStatusValue == "") &&
        ((paramOrder.loaiPizza != null &&
          paramOrder.loaiPizza.toLowerCase() == vPizzaTypeValue) ||
          vPizzaTypeValue == "")
      );
    });
    // console.log(vOrderResult);
    return vOrderResult;
  },
  // 4 - CRUD - Delete
  deleteOrder: function () {
    var vId = gOrderIdObjectForEdit.id;
    var vOrderId = gOrderIdObjectForEdit.orderId;
    $.ajax({
      url: gBASE_URL_ORDERS + "/" + vId,
      type: "DELETE",
      success: function () {
        alert("Copy OrderId để check đơn: " + vOrderId);
      },
      error: function (ajaxContext) {
        console.log(ajaxContext.statusText);
      },
    }).done(function () {
      setInterval("location.reload()", 3000);
    });
  },
  getIndexFromOrderId: function (currentOrderId) {
    var vOrderIndex = -1;
    var vOrderFound = false;
    var vLoopIndex = 0;
    while (!vOrderFound && vLoopIndex < this.orders.length) {
      if (this.orders[vLoopIndex].id === currentOrderId) {
        vOrderIndex = vLoopIndex;
        vOrderFound = true;
      } else {
        vLoopIndex++;
      }
    }
    return vOrderIndex;
  },
};

// Chọn Combo (size) của Pizza
var gSelectedCombo = "";

// If voucher existed
var gVoucher = {};

// Thông tin Order
var gOrderInfoObject = {
  kichCo: "",
  duongKinh: "",
  suon: "",
  salad: "",
  loaiPizza: "",
  idVourcher: -1,
  idLoaiNuocUong: "",
  soLuongNuoc: "",
  hoTen: "",
  thanhTien: "",
  email: "",
  soDienThoai: "",
  diaChi: "",
  loiNhan: "",
};

var gPizzaComboObj = {
  comboObjs: [
    {
      menuName: "Small",
      menuCode: "s",
      duongKinhCM: 20,
      suongNuong: 2,
      saladGr: 200,
      drinkNumber: 2,
      priceVND: 150000,
    },
    {
      menuName: "Medium",
      menuCode: "m",
      duongKinhCM: 25,
      suongNuong: 4,
      saladGr: 300,
      drinkNumber: 3,
      priceVND: 200000,
    },
    {
      menuName: "Large",
      menuCode: "l",
      duongKinhCM: 30,
      suongNuong: 8,
      saladGr: 500,
      drinkNumber: 4,
      priceVND: 250000,
    },
  ],
  pizzaComboLoading: function () {
    var vComboPizzaSelect = $("#create-order-modal-combo-select");
    var vComboOptionHTML = `<option value="">Chọn</option>`;
    this.comboObjs.forEach(
      (paramCombo) =>
        (vComboOptionHTML += `<option value="${paramCombo.menuName}">${paramCombo.menuName}</option>`)
    );
    vComboPizzaSelect.append(vComboOptionHTML);

    vComboPizzaSelect.on("change", this.onSelectComboClick);
  },
  onSelectComboClick: function () {
    // console.log("Đang chọn Combo");
    var vMenuName = $(this).val();
    switch (vMenuName) {
      case "Small":
        loadComboInfo(vMenuName);
        break;
      case "Medium":
        loadComboInfo(vMenuName);
        break;
      case "Large":
        loadComboInfo(vMenuName);
        break;
      default:
        resetComboField();
    }
  },
};

const gCOLUMN_ORDER_ID = 0;
const gCOLUMN_COMBO_SIZE = 1;
const gCOLUMN_PIZZA_TYPE = 2;
const gCOLUMN_DRINK = 3;
const gCOLUMN_AMOUNT = 4;
const gCOLUMN_NAME = 5;
const gCOLUMN_PHONE = 6;
const gCOLUMN_STATUS = 7;
const gCOLUMN_ACTION = 8;

var gORDER_COL = [
  "orderId",
  "kichCo",
  "loaiPizza",
  "idLoaiNuocUong",
  "thanhTien",
  "hoTen",
  "soDienThoai",
  "trangThai",
  "action",
];

// Lưu OrderId của phần Edit/Delete
var gOrderIdObjectForEdit = {
  id: "",
  orderId: "",
};

// Lấy OrderId của phần Tạo đơn mới
var gOrderIdForCreate = {
  id: "",
  orderId: "",
};

var gOderTable = $("#order-table").DataTable({
  paging: false,
  info: false,
  searching: false,
  // Khai báo các cột của datatable
  columns: [
    { data: gORDER_COL[gCOLUMN_ORDER_ID] },
    { data: gORDER_COL[gCOLUMN_COMBO_SIZE] },
    { data: gORDER_COL[gCOLUMN_PIZZA_TYPE] },
    { data: gORDER_COL[gCOLUMN_DRINK] },
    { data: gORDER_COL[gCOLUMN_AMOUNT] },
    { data: gORDER_COL[gCOLUMN_NAME] },
    { data: gORDER_COL[gCOLUMN_PHONE] },
    { data: gORDER_COL[gCOLUMN_STATUS] },
    { data: gORDER_COL[gCOLUMN_ACTION] },
  ],
  // Ghi đè nội dung của cột action, chuyển thành button chi tiết
  columnDefs: [
    {
      targets: gCOLUMN_ACTION,
      defaultContent: ` 
      <i class="fas fa-edit text-lightblue btn-edit" 
      style="cursor: pointer;" data-toggle="tooltip" title="Edit">&nbsp;</i>
      <i class="fas fa-trash-alt text-maroon btn-delete" 
      style="cursor: pointer;" data-toggle="tooltip" title="Delete"></i>
      `,
      className: "text-center",
    },
  ],
});

var gPizzaTypeObj = {
  pizzaTypeObjs: [
    {
      pizzaType: "Seafood",
      pizzaCode: "sf",
      pizzaName: "ocean mania",
      tagLine: "Pizza Hải Sản xốt Mayonnaise",
      content:
        "Xốt Cà Chua, Phô Mai Mozzarella, Tôm, Mực, Thanh Cua, Hành Tây.",
    },
    {
      pizzaType: "Hawaii",
      pizzaCode: "hw",
      pizzaName: "Hawaiian",
      tagLine: "Pizza Dăm Bông Dứa Kiểu Hawaii",
      content: "Xốt Cà Chua, Phô Mai Mozzarella, Thịt Dăm Bông, Dứa.",
    },
    {
      pizzaType: "Bacon",
      pizzaCode: "bc",
      pizzaName: "Cheesey Chicken Bacon",
      tagLine: "Pizza Gà Phô Mai Thịt Heo Xông Khói",
      content:
        "Xốt Phô Mai, Thịt Gà, Thị Heo Muối, Phô Mai Mozzarella, Cà Chua.",
    },
  ],
  loadPizzaTypeToOrderModal: function () {
    var vPizzaSelect = $("#create-order-modal-pizza-type-select");
    var vPizzaOptionHTML = `<option value="">Chọn</option>`;
    this.pizzaTypeObjs.forEach((paramPizza) => {
      vPizzaOptionHTML += `<option value="${paramPizza.pizzaType}">${paramPizza.pizzaType}</option>`;
    });
    vPizzaSelect.append(vPizzaOptionHTML);

    vPizzaSelect.on("change", onSelectPizzaClick);
  },
};

// Load drink to drink Select of Modal (Add/Edit)
var gDrinkObj = {
  drinkObjs: [],
  getDrinkObjFromAPI: function () {
    $.ajax({
      url: gBASE_URL_DRINKS,
      async: false,
      type: "GET",
      dataType: "json",
      success: function (resDrinks) {
        // console.log(resDrinks);
        this.drinkObjs = resDrinks;
        loadDrinkToOrderModal(this.drinkObjs);
      },
      error: function (ajaxContext) {
        console.log(ajaxContext.statusText);
      },
    });
  },
};

/*** REGION 2 - Vùng gán / thực thi sự kiện cho các elements */

/*** REGION 3 - Event handlers - Vùng khai báo các hàm xử lý sự kiện */
// hàm xử lý sự kiện loading
function onPageLoading() {
  // console.log("hien thi du lieu");
  callAPIToLoadOrderListObject();
  loadOrderStatusToFilter();
  loadPizzaTypeToFilter();
}

// Khi nhấn nút thêm mới đơn hàng
function onBtnAddNewOrderClick() {
  // chuyển đổi trạng thái form về insert
  gFormMode = gFORM_MODE_INSERT;
  $("#div-form-mod").html(gFormMode);
  // Load Pizza Combo to Modal
  gPizzaComboObj.pizzaComboLoading();
  // Gọi API load drinks
  gDrinkObj.getDrinkObjFromAPI();
  // Load Pizza Type
  gPizzaTypeObj.loadPizzaTypeToOrderModal();
  // hiển thị modal
  $("#create-order-modal").modal("show");
}

function loadComboInfo(paramMenuName) {
  // console.log("Combo loading...", paramMenuName);
  var vDiameterInfo = $("#create-order-modal-diameter");
  var vRibPieceInfo = $("#create-order-modal-rib-piece");
  var vSaladInfo = $("#create-order-modal-salad");
  var vDrinkNumberInfo = $("#create-order-modal-number-drink");
  var vPriceInfo = $("#create-order-modal-price");

  if (paramMenuName !== "") {
    var bMenuInfo = gPizzaComboObj.comboObjs.find(
      (paramMenu) => paramMenu.menuName === paramMenuName
    );

    const { duongKinhCM, suongNuong, saladGr, drinkNumber, priceVND } =
      bMenuInfo;

    vDiameterInfo.val(duongKinhCM + " cm");
    vRibPieceInfo.val(suongNuong + " miếng");
    vSaladInfo.val(saladGr + " gram");
    vDrinkNumberInfo.val(drinkNumber + " chai");
    vPriceInfo.val(priceVND + " VNĐ");

    // Lấy thông tin cho Order
    gOrderInfoObject.kichCo = paramMenuName;
    gOrderInfoObject.duongKinh = duongKinhCM;
    gOrderInfoObject.suon = suongNuong;
    gOrderInfoObject.salad = saladGr;
    gOrderInfoObject.soLuongNuoc = drinkNumber;
    gOrderInfoObject.thanhTien = priceVND;

    // Lưu thông tin combo về biến Global
    gSelectedCombo = paramMenuName;
  }
  // console.log(gSelectedCombo);
}

function resetComboField() {
  $("#create-order-modal-rib-piece").val("");
  $("#create-order-modal-diameter").val("");
  $("#create-order-modal-salad").val("");
  $("#create-order-modal-number-drink").val("");
  $("#create-order-modal-price").val("");
  // Reset Combo Select
  gSelectedCombo = "";
  // Reset gOrder
  gOrderInfoObject.kichCo = "";
  gOrderInfoObject.duongKinh = "";
  gOrderInfoObject.suon = "";
  gOrderInfoObject.salad = "";
  gOrderInfoObject.soLuongNuoc = "";
  gOrderInfoObject.thanhTien = "";
  // console.log(gOrderInfoObject);
  // console.log(gSelectedCombo);
}

function onSelectPizzaClick() {
  var vSelectedPizza = $(this).val();
  gOrderInfoObject.loaiPizza = vSelectedPizza;
  // console.log(gOrderInfoObject);
}

function loadDrinkToOrderModal(paramDrinkObjs) {
  var vDrinkSelect = $("#create-order-modal-drink-type-select");
  var vDrinkOptionHTML = `<option value="">Chọn</option>`;
  // console.log(paramDrinkObjs);
  paramDrinkObjs.forEach(
    (paramDrink) =>
      (vDrinkOptionHTML += `<option value="${paramDrink.maNuocUong}">${paramDrink.tenNuocUong}</option>`)
  );
  vDrinkSelect.append(vDrinkOptionHTML);

  vDrinkSelect.on("change", onSelectDrinkClick);
}

function onSelectDrinkClick() {
  // console.log("Click chọn Drink");
  // console.log($(this).val());
  var vSelectedDrink = $(this).val();

  if (vSelectedDrink !== "") {
    gOrderInfoObject.idLoaiNuocUong = vSelectedDrink;
  }

  return vSelectedDrink;
}

// Ở modal tạo order, nhấn nút tạo đơn
function onBtnCreateOrder() {
  // console.log("click tạo đơn");
  var vValidData = orderInfoValidation();
  // var vValidData = true;
  if (vValidData) {
    // Nếu Order Info đã valid thì lấy vào
    var vOrderInput = getFormInput();
    // Lấy toàn bộ thông tin Order
    getOrderInfo(vOrderInput);
    // Hiển thị thông tin Order
    postOrderToAPI();
  }
}

function getFormInput() {
  var vUserInputInfo = {
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    voucherCode: "",
    message: "",
  };

  var vInputName = $("#create-order-modal-full-name").val().trim();
  var vInputEmail = $("#create-order-modal-email").val().trim();
  var vInputDienthoai = $("#create-order-modal-phone-number").val().trim();
  var vInputDiachi = $("#create-order-modal-address").val().trim();
  var vInputvoucherCode = $("#create-order-modal-voucher").val().trim();
  var vInputMessage = $("#create-order-modal-message").val().trim();

  vUserInputInfo.name = vInputName;
  vUserInputInfo.email = vInputEmail;
  vUserInputInfo.phoneNumber = vInputDienthoai;
  vUserInputInfo.address = vInputDiachi;
  vUserInputInfo.voucherCode = vInputvoucherCode;
  vUserInputInfo.message = vInputMessage;
  // console.log(vInputName);

  return vUserInputInfo;
}

function orderInfoValidation() {
  var vIsValidate = true;

  var vComboAndPizzaValidation = pizzaComboAndTypeValidation();
  var vDrinkValidation = drinkSelectValidation(gOrderInfoObject.idLoaiNuocUong);
  var vCustomerInfoValidation = customerInfoValidation();

  if (!vCustomerInfoValidation) {
    vIsValidate = false;
  }

  if (!vDrinkValidation) {
    vIsValidate = false;
  }

  if (!vComboAndPizzaValidation) {
    vIsValidate = false;
  }

  return vIsValidate;
}

function customerInfoValidation() {
  // Kiểm tra dữ liệu khi nhập vào - User Info Validation
  var vValidator = $("#create-order-form").validate({
    // focusCleanup: true,
    rules: {
      name: {
        required: true,
      },
      phoneNumber: {
        required: true,
        number: true,
      },
      email: {
        required: true,
        strictEmail: true,
      },
      address: {
        required: true,
      },
    },
    messages: {
      name: "Cần nhập họ và tên",
      phoneNumber: {
        required: "Cần nhập số điện thoại",
        number: "Số điện thoại phải là một số",
      },
      email: {
        required: "Bạn cần nhập email",
        strictEmail: "Không tồn tại email dạng này",
      },
      address: "Cần nhập địa chỉ",
    },
  });

  var vValid = vValidator.form();
  // console.log(vValid);
  return vValid;
}

function inputVoucherChecking(paramCustomerInput) {
  var vVoucherCode = paramCustomerInput.voucherCode;
  // console.log("voucherInput is", vVoucherCode);
  if (vVoucherCode != "") {
    $.ajax({
      // 12332, 95531, 81432
      async: false,
      url: gBASE_URL_VOUCHERS + vVoucherCode,
      type: "GET",
      dataType: "json",
      success: function (resVoucherObj) {
        gVoucher = resVoucherObj;
        toastr.success("Voucher is accepted!");
      },
      error: function (ajaxContext) {
        console.log(ajaxContext.statusText);
        toastr.error("Voucher is not existed");
      },
    });
  } else {
    toastr.warning("This Order does not include the Voucher");
  }
}

function pizzaComboAndTypeValidation() {
  var vFlag = true;
  if (gSelectedCombo == "") {
    Toast.fire({
      icon: "error",
      title: "Bạn chưa chọn Combo",
    });
    vFlag = false;
  }

  if (gOrderInfoObject.loaiPizza == "") {
    Toast.fire({
      icon: "error",
      title: "Bạn chưa chọn Pizza Type",
    });
    vFlag = false;
  }

  return vFlag;
}

function drinkSelectValidation(paramDrink) {
  var vFlag = true;
  if (paramDrink == "") {
    Toast.fire({
      icon: "error",
      title: "Bạn chưa chọn nước uống",
    });
    vFlag = false;
  }
  return vFlag;
}

function getOrderInfo(paramCustomerInput) {
  // Kiểm tra voucher (is not null, existing)
  inputVoucherChecking(paramCustomerInput);

  const { name, email, phoneNumber, address, voucherCode, message } =
    paramCustomerInput;

  const { id, phanTramGiamGia, maVoucher } = gVoucher;

  if (id !== undefined) {
    gOrderInfoObject.idVourcher = maVoucher;
  }
  gOrderInfoObject.hoTen = name;
  gOrderInfoObject.email = email;
  gOrderInfoObject.soDienThoai = phoneNumber;
  gOrderInfoObject.diaChi = address;
  gOrderInfoObject.loiNhan = message;
}

// 2 - CRUD - Read
function callAPIToLoadOrderListObject() {
  $.ajax({
    url: gBASE_URL_ORDERS,
    type: "GET",
    dataType: "json",
    success: function (resOrder) {
      // console.log(resOrder);
      gOrderResObj.orders = resOrder;
      gOrderResObj.orders = gOrderResObj.orders.slice(0, 50);
      tableLoading(gOrderResObj.orders);
    },
    error: function (ajaxContext) {
      console.log(ajaxContext.statusText);
    },
  });
}

// 2 - Read - Đọc/load đơn hàng ra Table
function tableLoading(paramOrders) {
  gOderTable.clear();
  gOderTable.rows.add(paramOrders);
  gOderTable.draw();
}

function loadPizzaTypeToFilter() {
  var vPizzaSelect = $("#select-pizza");
  var vPizzaTypeArray = ["Hawaii", "Seafood", "Bacon"];
  var vPizzaOption = `<option value="">None</option>`;
  vPizzaSelect.append(vPizzaSelect);
  vPizzaTypeArray.forEach(
    (item) =>
      (vPizzaOption += `<option value="${item.toLowerCase()}">${item}</option>`)
  );
  vPizzaSelect.append(vPizzaOption);
}

// Load Status to Select
function loadOrderStatusToFilter() {
  var vStatusSelect = $("#select-status");
  var vStatusArray = ["open", "confirm", "cancel"];
  var vStatusOption = "";
  vStatusSelect.append(`<option value="">None</option>`);
  vStatusArray.forEach(
    (item) => (vStatusOption += `<option value="${item}">${item}</option>`)
  );
  vStatusSelect.append(vStatusOption);
}

function onBtnFilterClick() {
  "use strict";
  // console.log("filter click");
  // B1 - Get filter Data
  var vSelectedFilterData = getDataFromSelectField();
  // console.log(vSelectedFilterData);
  // B2 - Validate

  // B3: Filtering
  var vOrderResult = dataFiltering(vSelectedFilterData);

  tableLoading(vOrderResult);
  toastr.success("Filtering...");
}

function getDataFromSelectField() {
  var vSelectedFilterData = {
    status: "",
    pizzaType: "",
  };
  vSelectedFilterData.status = $("#select-status").val();
  vSelectedFilterData.pizzaType = $("#select-pizza").val();

  // console.log(vSelectedFilterData);
  return vSelectedFilterData;
}
function dataFiltering(paramSelectedFilterData) {
  var vOrderResults = [];
  vOrderResults = gOrderResObj.filterOders(paramSelectedFilterData);
  // console.log(vOrderResults);
  return vOrderResults;
}

// 3 - CRUD - Update
function onBtnEditOrder() {
  "use strict";
  gFormMode = gFORM_MODE_UPDATE;
  $("#div-form-mod").html(gFormMode);
  // console.log("Đây là nút Edit");
  var vRowSelected = $(this).parents("tr");
  // Lấy data of row
  var vDataRow = gOderTable.row(vRowSelected);
  var vRowOrderData = vDataRow.data();
  // console.log(vRowOrderData);
  var { id, orderId } = vRowOrderData;
  gOrderIdObjectForEdit = { id, orderId };
  callAPIToLoadOrderByOrderId(orderId);
  // console.log(gOrderIdObjectForEdit);
  $("#edit-order-modal").modal("show");
}

// Loading order to modal for editing (Update)
function callAPIToLoadOrderByOrderId(paramOrderId) {
  $.ajax({
    url: gBASE_URL_ORDERS + "/" + paramOrderId,
    type: "GET",
    dataType: "json",
    success: function (resOrder) {
      // console.log(resOrder);
      orderModalLoadingToEdit(resOrder);
    },
    error: function (ajaxContext) {
      console.log(ajaxContext.statusText);
    },
  });
}

// On click to the Delete Button from table/cell
function onBtnDeleteOrder() {
  // console.log("click");
  // chuyển đổi trạng thái form về update
  gFormMode = gFORM_MODE_DELETE;
  $("#div-form-mod").html(gFormMode);
  // console.log("Đây là nút Delete");
  var vRowSelected = $(this).parents("tr");
  // Lấy data of row
  var vDataRow = gOderTable.row(vRowSelected);
  var vRowOrderData = vDataRow.data();
  // console.log(vRowOrderData);
  var { id, orderId } = vRowOrderData;
  gOrderIdObjectForEdit = { id, orderId };
  $("#delete-confirm-modal").modal("show");
}

function onBtnConfirmDeleteOrderClick() {
  gOrderResObj.deleteOrder();
  $("#delete-confirm-modal").modal("hide");
  tableLoading(gOrderResObj.orders);
  resetFormToNormal();
}

function orderModalLoadingToEdit(paramOrder) {
  // Truy xuất các input element bằng id
  var vInputOrderIdElement = $("#order-id");
  var vInputComboSizeElement = $("#modal-combo-size");
  var vInputPizzaDiameterElement = $("#pizza-diameter");
  var vInputRibPieceElement = $("#rib-piece");
  var vInputSaladElement = $("#salad");
  var vInputPizzaTypeElement = $("#modal-pizza-type");

  var vInputVoucherIdElement = $("#voucher-id");
  var vInputAmountElement = $("#amount");
  var vInputDiscountElement = $("#discount");
  var vInputPaidElement = $("#modal-paid");

  var vInputSelectedDrinkElement = $("#selected-drink");
  var vInputNumberDrinkElement = $("#number-drink");

  var vInputFullNameElement = $("#full-name");
  var vInputEmailElement = $("#email");
  var vInputPhoneNumberElement = $("#phone-number");
  var vInputAddressElement = $("#address");
  var vInputMessageElement = $("#message");

  var vInputOrderStatusElement = $("#modal-order-status");

  var vInputCreatedDateElement = $("#created-date");
  var vInputUpdatedDateElement = $("#updated-date");

  const {
    orderId,
    kichCo,
    duongKinh,
    suon,
    salad,
    loaiPizza,
    idVourcher,
    thanhTien,
    giamGia,
    idLoaiNuocUong,
    soLuongNuoc,
    hoTen,
    email,
    soDienThoai,
    diaChi,
    loiNhan,
    trangThai,
    ngayTao,
    ngayCapNhat,
  } = paramOrder;

  // Gán value cho các input element với Data lấy được từ Order Object
  vInputOrderIdElement.val(orderId);
  vInputComboSizeElement.val(kichCo);
  vInputPizzaDiameterElement.val(duongKinh + " cm");
  vInputRibPieceElement.val(suon + " miếng");
  vInputSaladElement.val(salad + " gram");
  vInputPizzaTypeElement.val(loaiPizza);

  vInputVoucherIdElement.val(idVourcher);
  vInputAmountElement.val(thanhTien + " VNĐ");
  vInputDiscountElement.val(giamGia + " VNĐ");

  var vPaid = 0;
  if (thanhTien > giamGia) {
    vPaid = thanhTien - giamGia;
  }

  vInputPaidElement.val(vPaid + " VNĐ");

  vInputSelectedDrinkElement.val(idLoaiNuocUong);
  vInputNumberDrinkElement.val(soLuongNuoc + " chai");

  vInputFullNameElement.val(hoTen);
  vInputEmailElement.val(email);
  vInputPhoneNumberElement.val("(+84) " + soDienThoai);
  vInputAddressElement.val(diaChi);
  vInputMessageElement.val(loiNhan);
  vInputOrderStatusElement.val(trangThai);

  // Chuyển đổi data nhận được thành định dạng Date (ngày tháng năm)
  var vCreatedDate = new Date(ngayTao);
  var vUpdatedDate = new Date(ngayCapNhat);
  // console.log(vCreatedDate.toDateString());
  vInputCreatedDateElement.val(vCreatedDate.toDateString());
  vInputUpdatedDateElement.val(vUpdatedDate.toDateString());
}

// Ấn nút confirm chuyển trạng thái của Order và update thông tin bằng API
function onBtnConfirmClick() {
  "use strict";
  // console.log("Confirm click - Id", gOrderIdObjectForEdit.id);
  // console.log("Confirm click - OrderId", gOrderIdObjectForEdit.orderId);
  var vOrderStatus = "confirmed";
  updateOrderStatus(vOrderStatus);
  alert("Copy OrderId để check đơn: " + gOrderIdObjectForEdit.orderId);
  $("#edit-order-modal").modal("hide");

  resetFormToNormal();
}

// Ấn nút cancel chuyển trạng thái của Order và update thông tin bằng API
function onBtnCancelClick() {
  "use strict";
  // console.log("Cancel click - Id", gOrderIdObjectForEdit.id);
  var vOrderStatus = "cancel";
  updateOrderStatus(vOrderStatus);
  alert("Copy OrderId để check đơn: " + gOrderIdObjectForEdit.orderId);
  $("#edit-order-modal").modal("hide");

  resetFormToNormal();
}

// Nhận status khi nhấn các button Confirm hoặc Cancel và redirect về View Order List
function updateOrderStatus(paramOrderStatus) {
  "use strict";
  var vId = gOrderIdObjectForEdit.id;
  var vConfirmRequest = {
    trangThai: paramOrderStatus, //3 trang thai open, confirmed, cancel
  };

  $.ajax({
    url: gBASE_URL_ORDERS + "/" + vId,
    // async: false,
    type: "PUT",
    contentType: "application/json;charset=UTF-8",
    data: JSON.stringify(vConfirmRequest),
    success: function (responseOrder) {
      console.log(responseOrder);
    },
    error: function (ajaxContext) {
      alert(ajaxContext.responseText);
    },
  }).done(function () {
    setInterval("location.reload()", 3000);
  });
}

function resetFormToNormal() {
  // đổi trạng thái về normal
  gFormMode = gFORM_MODE_NORMAL;
  $("#div-form-mod").html(gFormMode);

  $("#order-id").val("").val("");
  $("#modal-combo-size option").remove();
  $("#pizza-diameter").val("");
  $("#rib-piece").val("");
  $("#salad").val("");
  $("#modal-pizza-type option").remove();
  $("#voucher-id").val("");
  $("#amount").val("");
  $("#discount").val("");
  $("#selected-drink").val("");
  $("#number-drink").val("");
  $("#full-name").val("");
  $("#email").val("");
  $("#phone-number").val("");
  $("#address").val("");
  $("#message").val("");
  $("#modal-order-status option").remove("");
  $("#created-date").val("");
  $("#updated-date").val("");

  // cập nhật lại gOrderIdObjectForEdit
  gOrderIdObjectForEdit = {
    id: "",
    orderId: "",
  };
}

// Tạo Order mới
function postOrderToAPI() {
  const vUtf8TextApplicationHeader = "application/json;charset=UTF-8";
  $.ajax({
    url: gBASE_URL_ORDERS,
    async: true,
    type: "POST",
    dataType: "json",
    data: JSON.stringify(gOrderInfoObject),
    contentType: vUtf8TextApplicationHeader,
    success: function (responseOrder) {
      // console.log(responseOrder);
      var vCreatedOrder = responseOrder;
      getOrderId(vCreatedOrder);
    },
    error: function (ajaxContext) {
      console.log(ajaxContext.statusText);
    },
  });
  $("#create-order-modal").modal("hide");
  // Toast - Create Order
}

function getOrderId(paramCreatedOrder) {
  "use strict";
  gOrderIdForCreate.id = paramCreatedOrder.id;
  gOrderIdForCreate.orderId = paramCreatedOrder.orderId;
  // console.log(gOrderIdForCreate);
  $("#modal-order-id").val(gOrderIdForCreate.orderId);
  $("#modal-order-success").modal("show");
  setInterval(`$("#modal-order-success").modal("hide")`, 4000);
  setInterval("location.reload()", 5000);
  toastr.success("Pizza Order was created and page is reloading in a second");
}

/*** REGION 4 - Common funtions - Vùng khai báo hàm dùng chung trong toàn bộ chương trình*/
