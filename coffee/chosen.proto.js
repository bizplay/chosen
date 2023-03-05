(function() {
  this.Chosen = (function() {
    var triggerHtmlEvent;

    class Chosen extends AbstractChosen {
      setup() {
        return this.current_selectedIndex = this.form_field.selectedIndex;
      }

      set_up_html() {
        var container_classes, container_props;
        container_classes = ["chosen-container"];
        container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
        if (this.inherit_select_classes && this.form_field.className) {
          container_classes.push(this.form_field.className);
        }
        if (this.is_rtl) {
          container_classes.push("chosen-rtl");
        }
        container_props = {
          'class': container_classes.join(' '),
          'title': this.form_field.title
        };
        if (this.form_field.id.length) {
          container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
        }
        this.container = new Element('div', container_props);
        // CSP without 'unsafe-inline' doesn't allow setting the style attribute directly
        this.container.setStyle({
          width: this.container_width()
        });
        if (this.is_multiple) {
          this.container.update(this.get_multi_html());
        } else {
          this.container.update(this.get_single_html());
        }
        this.form_field.hide().insert({
          after: this.container
        });
        this.dropdown = this.container.down('div.chosen-drop');
        this.search_field = this.container.down('input');
        this.search_results = this.container.down('ul.chosen-results');
        this.search_field_scale();
        this.search_no_results = this.container.down('li.no-results');
        if (this.is_multiple) {
          this.search_choices = this.container.down('ul.chosen-choices');
          this.search_container = this.container.down('li.search-field');
        } else {
          this.search_container = this.container.down('div.chosen-search');
          this.selected_item = this.container.down('.chosen-single');
        }
        this.results_build();
        this.set_tab_index();
        return this.set_label_behavior();
      }

      on_ready() {
        return this.form_field.fire("chosen:ready", {
          chosen: this
        });
      }

      register_observers() {
        this.container.observe("touchstart", (evt) => {
          return this.container_mousedown(evt);
        });
        this.container.observe("touchend", (evt) => {
          return this.container_mouseup(evt);
        });
        this.container.observe("mousedown", (evt) => {
          return this.container_mousedown(evt);
        });
        this.container.observe("mouseup", (evt) => {
          return this.container_mouseup(evt);
        });
        this.container.observe("mouseenter", (evt) => {
          return this.mouse_enter(evt);
        });
        this.container.observe("mouseleave", (evt) => {
          return this.mouse_leave(evt);
        });
        this.search_results.observe("mouseup", (evt) => {
          return this.search_results_mouseup(evt);
        });
        this.search_results.observe("mouseover", (evt) => {
          return this.search_results_mouseover(evt);
        });
        this.search_results.observe("mouseout", (evt) => {
          return this.search_results_mouseout(evt);
        });
        this.search_results.observe("mousewheel", (evt) => {
          return this.search_results_mousewheel(evt);
        });
        this.search_results.observe("DOMMouseScroll", (evt) => {
          return this.search_results_mousewheel(evt);
        });
        this.search_results.observe("touchstart", (evt) => {
          return this.search_results_touchstart(evt);
        });
        this.search_results.observe("touchmove", (evt) => {
          return this.search_results_touchmove(evt);
        });
        this.search_results.observe("touchend", (evt) => {
          return this.search_results_touchend(evt);
        });
        this.form_field.observe("chosen:updated", (evt) => {
          return this.results_update_field(evt);
        });
        this.form_field.observe("chosen:activate", (evt) => {
          return this.activate_field(evt);
        });
        this.form_field.observe("chosen:open", (evt) => {
          return this.container_mousedown(evt);
        });
        this.form_field.observe("chosen:close", (evt) => {
          return this.close_field(evt);
        });
        this.search_field.observe("blur", (evt) => {
          return this.input_blur(evt);
        });
        this.search_field.observe("keyup", (evt) => {
          return this.keyup_checker(evt);
        });
        this.search_field.observe("keydown", (evt) => {
          return this.keydown_checker(evt);
        });
        this.search_field.observe("focus", (evt) => {
          return this.input_focus(evt);
        });
        this.search_field.observe("cut", (evt) => {
          return this.clipboard_event_checker(evt);
        });
        this.search_field.observe("paste", (evt) => {
          return this.clipboard_event_checker(evt);
        });
        if (this.is_multiple) {
          return this.search_choices.observe("click", (evt) => {
            return this.choices_click(evt);
          });
        } else {
          return this.container.observe("click", (evt) => {
            return evt.preventDefault(); // gobble click of anchor
          });
        }
      }

      destroy() {
        var event, i, len, ref;
        this.container.ownerDocument.stopObserving("click", this.click_test_action);
        ref = ['chosen:updated', 'chosen:activate', 'chosen:open', 'chosen:close'];
        for (i = 0, len = ref.length; i < len; i++) {
          event = ref[i];
          this.form_field.stopObserving(event);
        }
        this.container.stopObserving();
        this.search_results.stopObserving();
        this.search_field.stopObserving();
        if (this.form_field_label != null) {
          this.form_field_label.stopObserving();
        }
        if (this.is_multiple) {
          this.search_choices.stopObserving();
          this.container.select(".search-choice-close").each(function(choice) {
            return choice.stopObserving();
          });
        } else {
          this.selected_item.stopObserving();
        }
        if (this.search_field.tabIndex) {
          this.form_field.tabIndex = this.search_field.tabIndex;
        }
        this.container.remove();
        return this.form_field.show();
      }

      search_field_disabled() {
        var ref;
        this.is_disabled = this.form_field.disabled || ((ref = this.form_field.up('fieldset')) != null ? ref.disabled : void 0) || false;
        if (this.is_disabled) {
          this.container.addClassName('chosen-disabled');
        } else {
          this.container.removeClassName('chosen-disabled');
        }
        this.search_field.disabled = this.is_disabled;
        if (!this.is_multiple) {
          this.selected_item.stopObserving('focus', this.activate_field);
        }
        if (this.is_disabled) {
          return this.close_field();
        } else if (!this.is_multiple) {
          return this.selected_item.observe('focus', this.activate_field);
        }
      }

      container_mousedown(evt) {
        var ref;
        if (this.is_disabled) {
          return;
        }
        if (evt && ((ref = evt.type) === 'mousedown' || ref === 'touchstart') && !this.results_showing) {
          evt.preventDefault();
        }
        if (!((evt != null) && evt.target.hasClassName("search-choice-close"))) {
          if (!this.active_field) {
            if (this.is_multiple) {
              this.search_field.clear();
            }
            this.container.ownerDocument.observe("click", this.click_test_action);
            this.results_show();
          } else if (!this.is_multiple && evt && (evt.target === this.selected_item || evt.target.up("a.chosen-single"))) {
            this.results_toggle();
          }
          return this.activate_field();
        }
      }

      container_mouseup(evt) {
        if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
          return this.results_reset(evt);
        }
      }

      search_results_mousewheel(evt) {
        var delta;
        delta = evt.deltaY || -evt.wheelDelta || evt.detail;
        if (delta != null) {
          evt.preventDefault();
          if (evt.type === 'DOMMouseScroll') {
            delta = delta * 40;
          }
          return this.search_results.scrollTop = delta + this.search_results.scrollTop;
        }
      }

      blur_test(evt) {
        if (!this.active_field && this.container.hasClassName("chosen-container-active")) {
          return this.close_field();
        }
      }

      close_field() {
        this.container.ownerDocument.stopObserving("click", this.click_test_action);
        this.active_field = false;
        this.results_hide();
        this.container.removeClassName("chosen-container-active");
        this.clear_backstroke();
        this.show_search_field_default();
        this.search_field_scale();
        return this.search_field.blur();
      }

      activate_field() {
        if (this.is_disabled) {
          return;
        }
        this.container.addClassName("chosen-container-active");
        this.active_field = true;
        this.search_field.value = this.get_search_field_value();
        return this.search_field.focus();
      }

      test_active_click(evt) {
        if (evt.target.up('.chosen-container') === this.container) {
          return this.active_field = true;
        } else {
          return this.close_field();
        }
      }

      results_build() {
        this.parsing = true;
        this.selected_option_count = null;
        this.results_data = SelectParser.select_to_array(this.form_field);
        if (this.is_multiple) {
          this.search_choices.select("li.search-choice").invoke("remove");
        } else {
          this.single_set_selected_text();
          if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold && !this.create_option) {
            this.search_field.readOnly = true;
            this.container.addClassName("chosen-container-single-nosearch");
          } else {
            this.search_field.readOnly = false;
            this.container.removeClassName("chosen-container-single-nosearch");
          }
        }
        this.update_results_content(this.results_option_build({
          first: true
        }));
        this.search_field_disabled();
        this.show_search_field_default();
        this.search_field_scale();
        return this.parsing = false;
      }

      result_do_highlight(el) {
        var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.addClassName("highlighted");
        maxHeight = parseInt(this.search_results.getStyle('maxHeight'), 10);
        visible_top = this.search_results.scrollTop;
        visible_bottom = maxHeight + visible_top;
        high_top = this.result_highlight.positionedOffset().top;
        high_bottom = high_top + this.result_highlight.getHeight();
        if (high_bottom >= visible_bottom) {
          return this.search_results.scrollTop = (high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0;
        } else if (high_top < visible_top) {
          return this.search_results.scrollTop = high_top;
        }
      }

      result_clear_highlight() {
        if (this.result_highlight) {
          this.result_highlight.removeClassName('highlighted');
        }
        return this.result_highlight = null;
      }

      results_show() {
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field.fire("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        this.container.addClassName("chosen-with-drop");
        this.results_showing = true;
        this.search_field.focus();
        this.search_field.value = this.get_search_field_value();
        this.winnow_results();
        return this.form_field.fire("chosen:showing_dropdown", {
          chosen: this
        });
      }

      update_results_content(content) {
        return this.search_results.update(content);
      }

      results_hide() {
        if (this.results_showing) {
          this.result_clear_highlight();
          this.container.removeClassName("chosen-with-drop");
          this.form_field.fire("chosen:hiding_dropdown", {
            chosen: this
          });
        }
        return this.results_showing = false;
      }

      set_tab_index(el) {
        var ti;
        if (this.form_field.tabIndex) {
          ti = this.form_field.tabIndex;
          this.form_field.tabIndex = -1;
          return this.search_field.tabIndex = ti;
        }
      }

      set_label_behavior() {
        this.form_field_label = this.form_field.up("label"); // first check for a parent label
        if (this.form_field_label == null) {
          this.form_field_label = $$(`label[for='${this.form_field.id}']`).first(); //next check for a for=#{id}
        }
        if (this.form_field_label != null) {
          return this.form_field_label.observe("click", this.label_click_handler);
        }
      }

      show_search_field_default() {
        if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
          this.search_field.value = this.default_text;
          return this.search_field.addClassName("default");
        } else {
          this.search_field.value = "";
          return this.search_field.removeClassName("default");
        }
      }

      search_results_mouseup(evt) {
        var target;
        target = evt.target.hasClassName("active-result") ? evt.target : evt.target.up(".active-result");
        if (target) {
          this.result_highlight = target;
          this.result_select(evt);
          return this.search_field.focus();
        }
      }

      search_results_mouseover(evt) {
        var target;
        target = evt.target.hasClassName("active-result") ? evt.target : evt.target.up(".active-result");
        if (target) {
          return this.result_do_highlight(target);
        }
      }

      search_results_mouseout(evt) {
        if (evt.target.hasClassName('active-result') || evt.target.up('.active-result')) {
          return this.result_clear_highlight();
        }
      }

      choice_build(item) {
        var choice, close_link;
        choice = new Element('li', {
          class: "search-choice"
        }).update(`<span>${this.choice_label(item)}</span>`);
        if (item.disabled) {
          choice.addClassName('search-choice-disabled');
        } else {
          close_link = new Element('a', {
            href: '#',
            class: 'search-choice-close',
            rel: item.array_index
          });
          close_link.observe("click", (evt) => {
            return this.choice_destroy_link_click(evt);
          });
          choice.insert(close_link);
        }
        return this.search_container.insert({
          before: choice
        });
      }

      choice_destroy_link_click(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        if (!this.is_disabled) {
          return this.choice_destroy(evt.target);
        }
      }

      choice_destroy(link) {
        if (this.result_deselect(link.readAttribute("rel"))) {
          if (this.active_field) {
            this.search_field.focus();
          } else {
            this.show_search_field_default();
          }
          if (this.is_multiple && this.choices_count() > 0 && this.get_search_field_value().length < 1) {
            this.results_hide();
          }
          link.up('li').remove();
          return this.search_field_scale();
        }
      }

      results_reset() {
        this.reset_single_select_options();
        this.form_field.options[0].selected = true;
        this.single_set_selected_text();
        this.show_search_field_default();
        this.results_reset_cleanup();
        this.trigger_form_field_change();
        if (this.active_field) {
          return this.results_hide();
        }
      }

      results_reset_cleanup() {
        var deselect_trigger;
        this.current_selectedIndex = this.form_field.selectedIndex;
        deselect_trigger = this.selected_item.down("abbr");
        if (deselect_trigger) {
          return deselect_trigger.remove();
        }
      }

      result_select(evt) {
        var high, item;
        if (this.result_highlight) {
          high = this.result_highlight;
          if (high.hasClassName("create-option")) {
            this.select_create_option(this.search_field.value);
            return this.results_hide();
          }
          this.result_clear_highlight();
          if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
            this.form_field.fire("chosen:maxselected", {
              chosen: this
            });
            return false;
          }
          if (this.is_multiple) {
            high.removeClassName("active-result");
          } else {
            this.reset_single_select_options();
          }
          high.addClassName("result-selected");
          item = this.results_data[high.getAttribute("data-option-array-index")];
          item.selected = true;
          this.form_field.options[item.options_index].selected = true;
          this.selected_option_count = null;
          if (this.is_multiple) {
            this.choice_build(item);
          } else {
            this.single_set_selected_text(this.choice_label(item));
          }
          if (this.is_multiple && (!this.hide_results_on_select || (evt.metaKey || evt.ctrlKey))) {
            if (evt.metaKey || evt.ctrlKey) {
              this.winnow_results({
                skip_highlight: true
              });
            } else {
              this.search_field.value = "";
              this.winnow_results();
            }
          } else {
            this.results_hide();
            this.show_search_field_default();
          }
          if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
            this.trigger_form_field_change();
          }
          this.current_selectedIndex = this.form_field.selectedIndex;
          evt.preventDefault();
          return this.search_field_scale();
        }
      }

      single_set_selected_text(text = this.default_text) {
        if (text === this.default_text) {
          this.selected_item.addClassName("chosen-default");
        } else {
          this.single_deselect_control_build();
          this.selected_item.removeClassName("chosen-default");
        }
        return this.selected_item.down("span").update(text);
      }

      result_deselect(pos) {
        var result_data;
        result_data = this.results_data[pos];
        if (!this.form_field.options[result_data.options_index].disabled) {
          result_data.selected = false;
          this.form_field.options[result_data.options_index].selected = false;
          this.selected_option_count = null;
          this.result_clear_highlight();
          if (this.results_showing) {
            this.winnow_results();
          }
          this.trigger_form_field_change();
          this.search_field_scale();
          return true;
        } else {
          return false;
        }
      }

      single_deselect_control_build() {
        if (!this.allow_single_deselect) {
          return;
        }
        if (!this.selected_item.down("abbr")) {
          this.selected_item.down("span").insert({
            after: "<abbr class=\"search-choice-close\"></abbr>"
          });
        }
        return this.selected_item.addClassName("chosen-single-with-deselect");
      }

      get_search_field_value() {
        return this.search_field.value;
      }

      get_search_text() {
        return this.get_search_field_value().strip();
      }

      escape_html(text) {
        return text.escapeHTML();
      }

      winnow_results_set_highlight() {
        var do_high;
        if (!this.is_multiple) {
          do_high = this.search_results.down(".result-selected.active-result");
        }
        if (do_high == null) {
          do_high = this.search_results.down(".active-result");
        }
        if (do_high != null) {
          return this.result_do_highlight(do_high);
        }
      }

      no_results(terms) {
        this.search_results.insert(this.get_no_results_html(terms));
        return this.form_field.fire("chosen:no_results", {
          chosen: this
        });
      }

      show_create_option(terms) {
        var create_option_html;
        create_option_html = this.get_create_option_html(terms);
        this.search_results.insert(create_option_html);
        return this.search_results.down(".create-option").observe("click", (evt) => {
          return this.select_create_option(terms);
        });
      }

      create_option_clear() {
        var co, results;
        co = null;
        results = [];
        while (co = this.search_results.down(".create-option")) {
          results.push(co.remove());
        }
        return results;
      }

      select_create_option(terms) {
        if (Object.isFunction(this.create_option)) {
          return this.create_option.call(this, terms);
        } else {
          return this.select_append_option({
            value: terms,
            text: terms
          });
        }
      }

      select_append_option(options) {
        this.form_field.insert(this.get_option_html(options));
        Event.fire(this.form_field, "chosen:updated");
        if (typeof Event.simulate === 'function') {
          this.form_field.simulate("change");
          return this.search_field.simulate("focus");
        }
      }

      no_results_clear() {
        var nr, results;
        nr = null;
        results = [];
        while (nr = this.search_results.down(".no-results")) {
          results.push(nr.remove());
        }
        return results;
      }

      keydown_arrow() {
        var next_sib;
        if (this.results_showing && this.result_highlight) {
          next_sib = this.result_highlight.next('.active-result');
          if (next_sib) {
            return this.result_do_highlight(next_sib);
          }
        } else if (this.results_showing && this.create_option) {
          return this.result_do_highlight(this.search_results.select('.create-option').first());
        } else {
          return this.results_show();
        }
      }

      keyup_arrow() {
        var actives, prevs, sibs;
        if (!this.results_showing && !this.is_multiple) {
          return this.results_show();
        } else if (this.result_highlight) {
          sibs = this.result_highlight.previousSiblings();
          actives = this.search_results.select("li.active-result");
          prevs = sibs.intersect(actives);
          if (prevs.length) {
            return this.result_do_highlight(prevs.first());
          } else {
            if (this.choices_count() > 0) {
              this.results_hide();
            }
            return this.result_clear_highlight();
          }
        }
      }

      keydown_backstroke() {
        var next_available_destroy;
        if (this.pending_backstroke) {
          this.choice_destroy(this.pending_backstroke.down("a"));
          return this.clear_backstroke();
        } else {
          next_available_destroy = this.search_container.siblings().last();
          if (next_available_destroy && next_available_destroy.hasClassName("search-choice") && !next_available_destroy.hasClassName("search-choice-disabled")) {
            this.pending_backstroke = next_available_destroy;
            if (this.pending_backstroke) {
              this.pending_backstroke.addClassName("search-choice-focus");
            }
            if (this.single_backstroke_delete) {
              return this.keydown_backstroke();
            } else {
              return this.pending_backstroke.addClassName("search-choice-focus");
            }
          }
        }
      }

      clear_backstroke() {
        if (this.pending_backstroke) {
          this.pending_backstroke.removeClassName("search-choice-focus");
        }
        return this.pending_backstroke = null;
      }

      search_field_scale() {
        var container_width, div, i, len, style, style_block, styles, width;
        if (!this.is_multiple) {
          return;
        }
        style_block = {
          position: 'absolute',
          left: '-1000px',
          top: '-1000px',
          display: 'none',
          whiteSpace: 'pre'
        };
        styles = ['fontSize', 'fontStyle', 'fontWeight', 'fontFamily', 'lineHeight', 'textTransform', 'letterSpacing'];
        for (i = 0, len = styles.length; i < len; i++) {
          style = styles[i];
          style_block[style] = this.search_field.getStyle(style);
        }
        div = new Element('div').update(this.escape_html(this.get_search_field_value()));
        // CSP without 'unsafe-inline' doesn't allow setting the style attribute directly
        div.setStyle(style_block);
        document.body.appendChild(div);
        width = div.measure('width') + 25;
        div.remove();
        if (container_width = this.container.getWidth()) {
          width = Math.min(container_width - 10, width);
        }
        return this.search_field.setStyle({
          width: width + 'px'
        });
      }

      trigger_form_field_change() {
        triggerHtmlEvent(this.form_field, 'input');
        return triggerHtmlEvent(this.form_field, 'change');
      }

    };

    triggerHtmlEvent = function(element, eventType) {
      var evt;
      if (element.dispatchEvent) { // Modern way:
        try {
          evt = new Event(eventType, {
            bubbles: true,
            cancelable: true
          });
        } catch (error) {
          evt = document.createEvent('HTMLEvents');
          evt.initEvent(eventType, true, true);
        }
        return element.dispatchEvent(evt); // Old IE:
      } else {
        return element.fireEvent(`on${eventType}`, document.createEventObject());
      }
    };

    return Chosen;

  }).call(this);

}).call(this);


//# sourceMappingURL=chosen.proto.js.map
//# sourceURL=coffeescript