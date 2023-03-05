(function() {
  var AbstractChosen;

  AbstractChosen = (function() {
    class AbstractChosen {
      constructor(form_field, options1 = {}) {
        this.label_click_handler = this.label_click_handler.bind(this);
        this.form_field = form_field;
        this.options = options1;
        if (!AbstractChosen.browser_is_supported()) {
          return;
        }
        this.is_multiple = this.form_field.multiple;
        this.set_default_text();
        this.set_default_values();
        this.setup();
        this.set_up_html();
        this.register_observers();
        // instantiation done, fire ready
        this.on_ready();
      }

      set_default_values() {
        this.click_test_action = (evt) => {
          return this.test_active_click(evt);
        };
        this.activate_action = (evt) => {
          return this.activate_field(evt);
        };
        this.active_field = false;
        this.mouse_on_container = false;
        this.results_showing = false;
        this.result_highlighted = null;
        this.is_rtl = this.options.rtl || /\bchosen-rtl\b/.test(this.form_field.className);
        this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
        this.disable_search_threshold = this.options.disable_search_threshold || 0;
        this.disable_search = this.options.disable_search || false;
        this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
        this.group_search = this.options.group_search != null ? this.options.group_search : true;
        this.search_contains = this.options.search_contains || false;
        this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
        this.max_selected_options = this.options.max_selected_options || 2e308;
        this.inherit_select_classes = this.options.inherit_select_classes || false;
        this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
        this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
        this.include_group_label_in_selected = this.options.include_group_label_in_selected || false;
        this.max_shown_results = this.options.max_shown_results || Number.POSITIVE_INFINITY;
        this.case_sensitive_search = this.options.case_sensitive_search || false;
        this.hide_results_on_select = this.options.hide_results_on_select != null ? this.options.hide_results_on_select : true;
        this.create_option = this.options.create_option || false;
        this.persistent_create_option = this.options.persistent_create_option || false;
        return this.skip_no_results = this.options.skip_no_results || false;
      }

      set_default_text() {
        if (this.form_field.getAttribute("data-placeholder")) {
          this.default_text = this.form_field.getAttribute("data-placeholder");
        } else if (this.is_multiple) {
          this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
        } else {
          this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
        }
        this.default_text = this.escape_html(this.default_text);
        this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
        return this.create_option_text = this.form_field.getAttribute("data-create_option_text") || this.options.create_option_text || AbstractChosen.default_create_option_text;
      }

      choice_label(item) {
        if (this.include_group_label_in_selected && (item.group_label != null)) {
          return `<b class='group-name'>${this.escape_html(item.group_label)}</b>${item.html}`;
        } else {
          return item.html;
        }
      }

      mouse_enter() {
        return this.mouse_on_container = true;
      }

      mouse_leave() {
        return this.mouse_on_container = false;
      }

      input_focus(evt) {
        if (this.is_multiple) {
          if (!this.active_field) {
            return setTimeout((() => {
              return this.container_mousedown();
            }), 50);
          }
        } else {
          if (!this.active_field) {
            return this.activate_field();
          }
        }
      }

      input_blur(evt) {
        if (!this.mouse_on_container) {
          this.active_field = false;
          return setTimeout((() => {
            return this.blur_test();
          }), 100);
        }
      }

      label_click_handler(evt) {
        if (this.is_multiple) {
          return this.container_mousedown(evt);
        } else {
          return this.activate_field();
        }
      }

      results_option_build(options) {
        var content, data, data_content, i, len, ref, shown_results;
        content = '';
        shown_results = 0;
        ref = this.results_data;
        for (i = 0, len = ref.length; i < len; i++) {
          data = ref[i];
          data_content = '';
          if (data.group) {
            data_content = this.result_add_group(data);
          } else {
            data_content = this.result_add_option(data);
          }
          if (data_content !== '') {
            shown_results++;
            content += data_content;
          }
          // this select logic pins on an awkward flag
          // we can make it better
          if (options != null ? options.first : void 0) {
            if (data.selected && this.is_multiple) {
              this.choice_build(data);
            } else if (data.selected && !this.is_multiple) {
              this.single_set_selected_text(this.choice_label(data));
            }
          }
          if (shown_results >= this.max_shown_results) {
            break;
          }
        }
        return content;
      }

      result_add_option(option) {
        var classes, option_el;
        if (!option.search_match) {
          return '';
        }
        if (!this.include_option_in_results(option)) {
          return '';
        }
        classes = [];
        if (!option.disabled && !(option.selected && this.is_multiple)) {
          classes.push("active-result");
        }
        if (option.disabled && !(option.selected && this.is_multiple)) {
          classes.push("disabled-result");
        }
        if (option.selected) {
          classes.push("result-selected");
        }
        if (option.group_array_index != null) {
          classes.push("group-option");
        }
        if (option.classes !== "") {
          classes.push(option.classes);
        }
        option_el = document.createElement("li");
        option_el.className = classes.join(" ");
        if (option.style) {
          option_el.style.cssText = option.style;
        }
        option_el.setAttribute("data-option-array-index", option.array_index);
        option_el.innerHTML = option.highlighted_html || option.html;
        if (option.title) {
          option_el.title = option.title;
        }
        return this.outerHTML(option_el);
      }

      result_add_group(group) {
        var classes, group_el;
        if (!(group.search_match || group.group_match)) {
          return '';
        }
        if (!(group.active_options > 0)) {
          return '';
        }
        classes = [];
        classes.push("group-result");
        if (group.classes) {
          classes.push(group.classes);
        }
        group_el = document.createElement("li");
        group_el.className = classes.join(" ");
        group_el.innerHTML = group.highlighted_html || this.escape_html(group.label);
        if (group.title) {
          group_el.title = group.title;
        }
        return this.outerHTML(group_el);
      }

      append_option(option) {
        return this.select_append_option(option);
      }

      results_update_field() {
        this.set_default_text();
        if (!this.is_multiple) {
          this.results_reset_cleanup();
        }
        this.result_clear_highlight();
        this.results_build();
        if (this.results_showing) {
          return this.winnow_results();
        }
      }

      reset_single_select_options() {
        var i, len, ref, result, results1;
        ref = this.results_data;
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          result = ref[i];
          if (result.selected) {
            results1.push(result.selected = false);
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      }

      results_toggle() {
        if (this.results_showing) {
          return this.results_hide();
        } else {
          return this.results_show();
        }
      }

      results_search(evt) {
        if (this.results_showing) {
          return this.winnow_results();
        } else {
          return this.results_show();
        }
      }

      winnow_results(options) {
        var escapedQuery, exactRegex, exact_result, fix, i, len, option, prefix, query, ref, regex, results, results_group, search_match, startpos, suffix, text;
        this.no_results_clear();
        results = 0;
        exact_result = false;
        query = this.get_search_text();
        escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        regex = this.get_search_regex(escapedQuery);
        exactRegex = new RegExp(`^${escapedQuery}$`);
        ref = this.results_data;
        for (i = 0, len = ref.length; i < len; i++) {
          option = ref[i];
          option.search_match = false;
          results_group = null;
          search_match = null;
          option.highlighted_html = '';
          if (this.include_option_in_results(option)) {
            if (option.group) {
              option.group_match = false;
              option.active_options = 0;
            }
            if ((option.group_array_index != null) && this.results_data[option.group_array_index]) {
              results_group = this.results_data[option.group_array_index];
              if (results_group.active_options === 0 && results_group.search_match) {
                results += 1;
              }
              results_group.active_options += 1;
            }
            text = option.group ? option.label : option.text;
            if (!(option.group && !this.group_search)) {
              search_match = this.search_string_match(text, regex);
              option.search_match = search_match != null;
              if (option.search_match && !option.group) {
                results += 1;
              }
              exact_result = exact_result || exactRegex.test(option.html);
              if (option.search_match) {
                if (query.length) {
                  startpos = search_match.index;
                  prefix = text.slice(0, startpos);
                  fix = text.slice(startpos, startpos + query.length);
                  suffix = text.slice(startpos + query.length);
                  option.highlighted_html = `${this.escape_html(prefix)}<em>${this.escape_html(fix)}</em>${this.escape_html(suffix)}`;
                }
                if (results_group != null) {
                  results_group.group_match = true;
                }
              } else if ((option.group_array_index != null) && this.results_data[option.group_array_index].search_match) {
                option.search_match = true;
              }
            }
          }
        }
        this.result_clear_highlight();
        if (results < 1 && query.length) {
          this.update_results_content("");
          if (!(this.create_option && this.skip_no_results)) {
            this.no_results(query);
          }
        } else {
          this.update_results_content(this.results_option_build());
          if (!(options != null ? options.skip_highlight : void 0)) {
            this.winnow_results_set_highlight();
          }
        }
        if (this.create_option && (results < 1 || (!exact_result && this.persistent_create_option)) && query.length) {
          return this.show_create_option(query);
        }
      }

      get_search_regex(escaped_search_string) {
        var regex_flag, regex_string;
        regex_string = this.search_contains ? escaped_search_string : `(^|\\s|\\b)${escaped_search_string}[^\\s]*`;
        if (!(this.enable_split_word_search || this.search_contains)) {
          regex_string = `^${regex_string}`;
        }
        regex_flag = this.case_sensitive_search ? "" : "i";
        return new RegExp(regex_string, regex_flag);
      }

      search_string_match(search_string, regex) {
        var match;
        match = regex.exec(search_string);
        if (!this.search_contains && (match != null ? match[1] : void 0)) {
          match.index += 1;
        }
        return match;
      }

      choices_count() {
        var i, len, option, ref;
        if (this.selected_option_count != null) {
          return this.selected_option_count;
        }
        this.selected_option_count = 0;
        ref = this.form_field.options;
        for (i = 0, len = ref.length; i < len; i++) {
          option = ref[i];
          if (option.selected) {
            this.selected_option_count += 1;
          }
        }
        return this.selected_option_count;
      }

      choices_click(evt) {
        evt.preventDefault();
        this.activate_field();
        if (!(this.results_showing || this.is_disabled)) {
          return this.results_show();
        }
      }

      keydown_checker(evt) {
        var ref, stroke;
        stroke = (ref = evt.which) != null ? ref : evt.keyCode;
        this.search_field_scale();
        if (stroke !== 8 && this.pending_backstroke) {
          this.clear_backstroke();
        }
        switch (stroke) {
          case 8: // backspace
            this.backstroke_length = this.get_search_field_value().length;
            break;
          case 9: // tab
            if (this.results_showing && !this.is_multiple) {
              this.result_select(evt);
            }
            this.mouse_on_container = false;
            break;
          case 13: // enter
            if (this.results_showing) {
              evt.preventDefault();
            }
            break;
          case 27: // escape
            if (this.results_showing) {
              evt.preventDefault();
            }
            break;
          case 32: // space
            if (this.disable_search) {
              evt.preventDefault();
            }
            break;
          case 38: // up arrow
            evt.preventDefault();
            this.keyup_arrow();
            break;
          case 40: // down arrow
            evt.preventDefault();
            this.keydown_arrow();
            break;
        }
      }

      keyup_checker(evt) {
        var ref, stroke;
        stroke = (ref = evt.which) != null ? ref : evt.keyCode;
        this.search_field_scale();
        switch (stroke) {
          case 8: // backspace
            if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
              this.keydown_backstroke();
            } else if (!this.pending_backstroke) {
              this.result_clear_highlight();
              this.results_search();
            }
            break;
          case 13: // enter
            evt.preventDefault();
            if (this.results_showing) {
              this.result_select(evt);
            }
            break;
          case 27: // escape
            if (this.results_showing) {
              this.results_hide();
            }
            break;
          case 9:
          case 16:
          case 17:
          case 18:
          case 38:
          case 40:
          case 91:
            break;
          default:
            // don't do anything on these keys
            this.results_search();
            break;
        }
      }

      clipboard_event_checker(evt) {
        if (this.is_disabled) {
          return;
        }
        return setTimeout((() => {
          return this.results_search();
        }), 50);
      }

      container_width() {
        if (this.options.width != null) {
          return this.options.width;
        } else {
          return `${this.form_field.offsetWidth}px`;
        }
      }

      include_option_in_results(option) {
        if (this.is_multiple && (!this.display_selected_options && option.selected)) {
          return false;
        }
        if (!this.display_disabled_options && option.disabled) {
          return false;
        }
        if (option.empty) {
          return false;
        }
        return true;
      }

      search_results_touchstart(evt) {
        this.touch_started = true;
        return this.search_results_mouseover(evt);
      }

      search_results_touchmove(evt) {
        this.touch_started = false;
        return this.search_results_mouseout(evt);
      }

      search_results_touchend(evt) {
        if (this.touch_started) {
          return this.search_results_mouseup(evt);
        }
      }

      outerHTML(element) {
        var tmp;
        if (element.outerHTML) {
          return element.outerHTML;
        }
        tmp = document.createElement("div");
        tmp.appendChild(element);
        return tmp.innerHTML;
      }

      get_single_html() {
        return `<a class="chosen-single chosen-default">\n  <span>${this.default_text}</span>\n  <div><b></b></div>\n</a>\n<div class="chosen-drop">\n  <div class="chosen-search">\n    <input class="chosen-search-input" type="text" autocomplete="off" />\n  </div>\n  <ul class="chosen-results"></ul>\n</div>`;
      }

      get_multi_html() {
        return `<ul class="chosen-choices">\n  <li class="search-field">\n    <input class="chosen-search-input" type="text" autocomplete="off" value="${this.default_text}" />\n  </li>\n</ul>\n<div class="chosen-drop">\n  <ul class="chosen-results"></ul>\n</div>`;
      }

      get_no_results_html(terms) {
        return `<li class="no-results">\n  ${this.results_none_found} <span>${this.escape_html(terms)}</span>\n</li>`;
      }

      get_option_html({value, text}) {
        return `<option value="${value}" selected>${text}</option>`;
      }

      get_create_option_html(terms) {
        return `<li class="create-option active-result"><a>${this.create_option_text}</a>: "${this.escape_html(terms)}"</li>`;
      }

      // class methods and variables ============================================================
      static browser_is_supported() {
        if ("Microsoft Internet Explorer" === window.navigator.appName) {
          return document.documentMode >= 8;
        }
        if (/iP(od|hone)/i.test(window.navigator.userAgent) || /IEMobile/i.test(window.navigator.userAgent) || /Windows Phone/i.test(window.navigator.userAgent) || /BlackBerry/i.test(window.navigator.userAgent) || /BB10/i.test(window.navigator.userAgent) || /Android.*Mobile/i.test(window.navigator.userAgent)) {
          return false;
        }
        return true;
      }

    };

    AbstractChosen.default_multiple_text = "Select Some Options";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "No results match";

    AbstractChosen.default_create_option_text = "Add Option";

    return AbstractChosen;

  }).call(this);

}).call(this);


//# sourceMappingURL=abstract-chosen.js.map
//# sourceURL=coffeescript