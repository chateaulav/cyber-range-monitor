// static/js/data_source_entries.js
import { ToggleMessage } from "./components/toggle_msg.js";
class DataSourceStatus {
  /**
   * @param {jQuery} $row - jQuery object of the row
   *
   *  @property {jQuery} $row - jQuery object of the row
   * @property {jQuery} $icon - jQuery object of the icon
   * @property {jQuery} $checkbox - jQuery object of the checkbox
   */
  constructor($row) {
    this.$row = $row;
    this.$icon = $row.find(".icon");
    this.$checkbox = $row.find(".datasource-checkbox");
  }
  toggleCheckbox() {
    this.$checkbox.prop("checked", !this.getStatus());
  }
  getStatus() {
    return this.$checkbox.prop("checked");
  }
  /**
   * toggles the checkbox, icon and row class
   */
  toggle() {
    this.toggleCheckbox();

    if (this.getStatus() && this.$row.hasClass("disabled")) {
      this.$row.removeClass("disabled");
    } else if (!this.getStatus() && !this.$row.hasClass("disabled")) {
      this.$row.addClass("disabled");
    }

    this.$icon.toggleClass("fa-check checked fa-times unchecked");
  }
  shake() {
    this.$icon.addClass("shake");
    setTimeout(() => {
      this.$icon.removeClass("shake");
    }, 1000);
  }
}

class DataSourceForm {
  /**
   * @param {jQuery} $row - jQuery object of the row
   * @property {jQuery} $form - jQuery object of the form
   * @property {string} url - endpoint for the form
   */
  constructor($row) {
    this.$form = $row.find("form");
    if (this.$form.length === 0) {
      throw new Error("DataSourceFormError: Could not initalize Form");
    }
    this.url = this.$form.attr("action");
  }

  getXhrData() {
    return {
      data: this.$form.serialize(),
      url: this.url,
    };
  }
}

class DataSource {
  /**
   * @param {jQuery} $row - jQuery object of the data source row
   * @property {DataSourceStatus} status - Status object
   * @property {DataSourceForm} form - Form object
   */
  constructor($row) {
    if ($row.length === 0) {
      throw new Error("Row not found");
    }
    this.status = new DataSourceStatus($row);
    this.form = new DataSourceForm($row);
  }
  /**
   * toggles the data source when the Icon is clicked
   * @param {ToggleMessage} messageBox - the message box to flash errors
   */
  toggle(messageBox) {
    const xhrData = this.form.getXhrData();
    const xhrHeaders = {
      type: "POST",
      url: xhrData.url,
      data: xhrData.data,
      dataType: "json",
    };
    this.update(xhrHeaders, messageBox); // Call update method
  }
  /**
   * @param {Object} xhrHeaders - the ajax headers
   * @param {ToggleMessage} messageBox - the message box to flash errors
   */
  update(xhrHeaders, messageBox) {
    const { type, url, data, dataType } = xhrHeaders;
    $.ajax({
      type: type,
      url: url,
      data: data,
      dataType: dataType,
      success: (response) => {
        if (response.success) {
          toggleAllSources(this.status.$icon);
          this.status.toggle();
          messageBox.show(
            `Successfully enabled new data source.`,
            "Success: ",
            "success-msg"
          );
        } else {
          this.status.shake();
          messageBox.show(
            response.error || "Data source update failed",
            "Error: ",
            "error-msg"
          );
        }
      },
      error: () => {
        this.status.shake();
        messageBox.show(
          "Oops something went wrong...",
          "Unknown Error:",
          "error-msg"
        );
      },
    });
  }
}

/**
 * @returns {DataSource[]} - an array of DataSource objects
 */
function getDataSources() {
  const dataSources = [];
  $(".data-source-entry").each(function () {
    dataSources.push(new DataSource($(this)));
  });
  return dataSources;
}

function toggleAllSources($toggledIcon) {
  window.dataSources.forEach((ds) => {
    if (!ds.status.$icon.is($toggledIcon)) {
      ds.status.toggle();
    }
  });
}
/**
 * allows the endpoint URL to copied when the icon is clicked
 */
function copyURLEvent() {
  $(".url-icon").on("click", function () {
    navigator.clipboard.writeText($(this).data("url"));
  });
}

$(document).ready(function () {
  const messageBox = new ToggleMessage("success-msg");
  window.dataSources = getDataSources();
  window.dataSources.forEach((ds) => {
    ds.status.$icon.click(() => {
      ds.toggle(messageBox);
    });
  });
  copyURLEvent();
});
