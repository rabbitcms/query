define(["require", "exports", "jquery", "query-builder"], function (require, exports, $) {
    "use strict";
    var RabbitCMSQueryBuilder = (function () {
        function RabbitCMSQueryBuilder() {
            this.filtersCache = {};
        }
        RabbitCMSQueryBuilder.prototype.init = function (entity, portlet) {
            var table = portlet.find('.table');
            var jQQB = $(".search-container", portlet);
            var queryBuilder = $.fn.queryBuilder;
            var RCMSjQQB = this;
            var defaultRules = {
                condition: 'AND',
                rules: [],
                data: {
                    entity: entity
                }
            };
            table.on('beforeSubmitFilter', function (e) {
                var result = jQQB.queryBuilder('getRules');
                var json = {};
                if (!$.isEmptyObject(result) && !$.isEmptyObject(result.rules)) {
                    json = JSON.stringify(result, null, 2);
                }
                if (!$.isEmptyObject(json)) {
                    e.data = { filters: json };
                }
            });
            table.on('beforeResetFilter', function (e) {
                jQQB.queryBuilder("clear");
                jQQB.queryBuilder('setRoot', false, { 'entity': entity });
            });
            portlet.on('submit', '#export-form', function () {
                var form = $(this);
                var result = jQQB.queryBuilder('getRules');
                var params = {};
                if (!$.isEmptyObject(result) && !$.isEmptyObject(result.rules)) {
                    params['qBuilder'] = JSON.stringify(result, null, 2);
                }
                $('.form-filter', table).each(function () {
                    var self = $(this);
                    params[self.attr('name')] = self.val();
                });
                $('.filter', form).remove();
                $.each(params, function (name, value) {
                    form.append($('<input/>').attr('type', 'hidden')
                        .attr('name', name)
                        .attr('value', value)
                        .attr('class', 'filter'));
                });
            });
            portlet.on('change', '[name="queries-list"]', function () {
                var rules = $('option:selected', this).data('rules');
                jQQB.queryBuilder('clear');
                jQQB.queryBuilder('setRules', rules ? rules : defaultRules);
            });
            queryBuilder.defaults({
                templates: {
                    group: this.getGroupTemplate()
                }
            });
            queryBuilder.define('bt-relation', function () {
                var self = this;
                self.on('getRuleFilters.filter', function (e, rule) {
                    $('[data-add="relation"] option[value!=""]', rule.parent.$el).remove();
                    e.value = e.value.filter(function (filter) {
                        var parent = rule.parent;
                        var relation;
                        while (parent && !relation) {
                            relation = parent.data ? parent.data.entity : null;
                            parent = parent.parent;
                        }
                        if (filter.id.startsWith((relation) + '.')) {
                            if (filter.data && filter.data.type === 'relation') {
                                $('[data-add="relation"]', rule.parent.$el).append($('<option/>').text(filter.label).attr('value', filter.data.entity)
                                    .attr('data-field', filter.field));
                                return false;
                            }
                            else {
                                return true;
                            }
                        }
                        return false;
                    });
                });
                self.on('ruleToJson.filter', function (e, rule) {
                    if (rule.filter.data && rule.filter.data.type === 'autocomplete') {
                        var values_1 = {};
                        rule.$el.find('.rule-value-container select option:selected').each(function () {
                            values_1[$(this).val()] = $(this).text();
                        });
                        e.value.data['values'] = values_1;
                    }
                });
                self.on('beforeAddRule.QueryBuilder', function (e, parent) {
                    var relation;
                    while (parent && !relation) {
                        relation = parent.data ? parent.data.entity : null;
                        parent = parent.parent;
                    }
                    if (relation != entity) {
                        RCMSjQQB.getFilters(relation, jQQB);
                    }
                });
                portlet.on('change', '[data-add="relation"]', function (e) {
                    var relationSelect = $(e.currentTarget);
                    var value = relationSelect.val();
                    var option = $('option:selected', relationSelect);
                    if (value !== '') {
                        RCMSjQQB.getFilters(value, jQQB);
                        var root = jQQB.queryBuilder('getModel', relationSelect.closest('.rules-group-container'));
                        var group = jQQB.queryBuilder('addGroup', root, true, { 'relation': option.data('field'), 'entity': value });
                        group.$el.find('.group-conditions').append('<button class="btn btn-xs btn-default"><i class="glyphicon"></i>' + option.text() + '</button>');
                    }
                    relationSelect[0].selectedIndex = 0;
                });
            }, {});
            jQQB.queryBuilder({
                plugins: ['bt-relation', 'bt-tooltip-errors'],
                filters: RCMSjQQB.getFilters(entity, jQQB, jQQB.data('filters')),
                allow_empty: true,
                rules: defaultRules
            });
            jQQB.on('afterUpdateRuleOperator.queryBuilder', this.updateRules);
            jQQB.on('afterCreateRuleInput.queryBuilder', this.updateRules);
            portlet.on('click', '[rel="save-query"]', function () {
                var querySelect = $('[name="queries-list"]', portlet);
                RabbitCMS.loadModalWindow(RabbitCMS.getPrefix() + '/query/queries/save', function (modal) {
                    var form = $('form', modal);
                    $('[name="name"]', form).val($('option:selected', querySelect).text());
                    if (querySelect.val() !== '') {
                        $('[name="id"]', form).val(querySelect.val());
                        $('[name="id"]', form).prop('checked', true);
                    }
                    form.validate({
                        ignore: '',
                        errorElement: 'span',
                        errorClass: 'help-block',
                        focusInvalid: true,
                        rules: {
                            "name": {
                                required: true
                            }
                        },
                        highlight: function (element) {
                            $(element).closest('.form-group').addClass('has-error');
                        },
                        success: function (label) {
                            label.closest('.form-group').removeClass('has-error');
                            label.remove();
                        },
                        errorPlacement: function (error, element) {
                            return true;
                        },
                        submitHandler: function (form) {
                            var result = jQQB.queryBuilder('getRules');
                            form = (form instanceof $) ? form : $(form);
                            if (!$.isEmptyObject(result) && !$.isEmptyObject(result.rules)) {
                                var data = new FormData(form[0]);
                                data.append('entity', entity);
                                data.append('data', JSON.stringify(result, null, 2));
                                RabbitCMS._ajax({ url: form.attr('action'), method: 'POST', processData: false, contentType: false, data: data }, function (data) {
                                    modal.modal('hide');
                                    setTimeout(function () {
                                        modal.remove();
                                    }, 1000);
                                    return false;
                                });
                            }
                        }
                    });
                });
            });
        };
        RabbitCMSQueryBuilder.prototype.getFilters = function (relation, jQQB, data) {
            var _this = this;
            if (this.filtersCache.hasOwnProperty(relation)) {
                return this.filtersCache[relation];
            }
            var update = function (filters) {
                _this.filtersCache[relation] = filters.map(function (filter) {
                    if (filter.data && filter.data.type === 'autocomplete') {
                        filter.valueSetter = function (rule, value) {
                            var select = rule.$el.find('.rule-value-container select');
                            select.empty();
                            value.forEach(function (item) {
                                if (item) {
                                    select.append($('<option/>').val(item)
                                        .text(rule.data.values[item] || item)
                                        .prop('selected', true));
                                }
                            });
                        };
                    }
                    return filter;
                });
                return _this.filtersCache[relation];
            };
            if (data) {
                return update(data);
            }
            RabbitCMS._ajax({
                method: 'GET',
                url: RabbitCMS.getPrefix() + '/query/queries/filters/' + relation,
                async: false
            }, function (data) {
                data = update(data);
                jQQB.queryBuilder("addFilter", data);
            });
        };
        RabbitCMSQueryBuilder.prototype.updateRules = function (e, rule) {
            var value_container = rule.$el.find('.rule-value-container [name*=_value_]');
            var filter_type = rule.filter.type;
            var input_type = rule.filter.input;
            $.each(value_container, function () {
                var input = $(this);
                if (input_type === 'select') {
                    if (input.data('select2')) {
                        input.select2('destroy');
                    }
                    input.prop('multiple', false);
                    if (rule.filter.multiple && (rule.operator.type === 'in' || rule.operator.type === 'not_in')) {
                        input.prop('multiple', true);
                    }
                    if (rule.filter.data && rule.filter.data.type === 'autocomplete') {
                        input.attr('style', 'width: 250px;');
                        input.select2({
                            lang: 'ua',
                            placeholder: 'Пошук',
                            minimumInputLength: 3,
                            id: function (bond) {
                                return bond.id;
                            },
                            ajax: {
                                url: RabbitCMS.getPrefix() + '/query/queries/values',
                                dataType: 'json',
                                delay: 250,
                                data: function (params) {
                                    return {
                                        term: params.term,
                                        field: rule.filter.field,
                                        entity: rule.parent.data.entity
                                    };
                                },
                                processResults: function (data, params) {
                                    return {
                                        results: data
                                    };
                                },
                                cache: true
                            },
                            templateResult: function (item, container, query, escapeMarkup) {
                                return item.text || item.value || item.id;
                            },
                            templateSelection: function (item) {
                                return item.text || item.value || item.id;
                            },
                            escapeMarkup: function (markup) {
                                return markup;
                            }
                        });
                    }
                    else {
                        input.select2();
                    }
                }
                if (rule.filter.data && rule.filter.data.type === 'amount') {
                    input.maskMoney($.extend({
                        thousands: ' ',
                        decimal: ',',
                        affixesStay: false
                    }, rule.filter.data.options));
                }
                switch (filter_type) {
                    case 'datetime':
                        input.datetimepicker($.extend({
                            format: rule.filter.data.format,
                            autoclose: true,
                            language: 'uk',
                            todayHighlight: true
                        }, rule.filter.data.options));
                        return;
                    case 'date':
                        input.datepicker($.extend({
                            format: rule.filter.data.format,
                            autoclose: true,
                            language: 'uk',
                            todayHighlight: true
                        }, rule.filter.data.options));
                        return;
                }
            });
        };
        RabbitCMSQueryBuilder.prototype.getGroupTemplate = function () {
            return '\
<dl id="{{= it.group_id }}" class="rules-group-container"> \
  <dt class="rules-group-header"> \
    <div class="btn-group pull-right group-actions"> \
      <select data-add="relation"> \
        <option value="">Зв\'язок</option> \
      </select> \
      <button type="button" class="btn btn-xs btn-success" data-add="rule"> \
        <i class="{{= it.icons.add_rule }}"></i> {{= it.translate("add_rule") }} \
      </button> \
      {{? it.settings.allow_groups===-1 || it.settings.allow_groups>=it.level }} \
        <button type="button" class="btn btn-xs btn-success" data-add="group"> \
          <i class="{{= it.icons.add_group }}"></i> {{= it.translate("add_group") }} \
        </button> \
      {{?}} \
      {{? it.level>1 }} \
        <button type="button" class="btn btn-xs btn-danger" data-delete="group"> \
          <i class="{{= it.icons.remove_group }}"></i> {{= it.translate("delete_group") }} \
        </button> \
      {{?}} \
    </div> \
    <div class="btn-group group-conditions"> \
      {{~ it.conditions: condition }} \
        <label class="btn btn-xs btn-primary"> \
          <input type="radio" name="{{= it.group_id }}_cond" value="{{= condition }}"> {{= it.translate("conditions", condition) }} \
        </label> \
      {{~}} \
    </div> \
    {{? it.settings.display_errors }} \
      <div class="error-container"><i class="{{= it.icons.error }}"></i></div> \
    {{?}} \
  </dt> \
  <dd class=rules-group-body> \
    <ul class=rules-list></ul> \
  </dd> \
</dl>';
        };
        return RabbitCMSQueryBuilder;
    }());
    return new RabbitCMSQueryBuilder();
});
//# sourceMappingURL=queries.js.map