define(["require", "exports", "jquery", "query-builder"], function (require, exports, $) {
    "use strict";
    var queryBuilder = $.fn.queryBuilder;
    queryBuilder.defaults({
        templates: {
            group: "\n<dl id=\"{{= it.group_id }}\" class=\"rules-group-container\">\n  <dt class=\"rules-group-header\">\n    <div class=\"btn-group pull-right group-actions\">\n      <select data-add=\"relation\">\n        <option value=\"\">\u0417\u0432'\u044F\u0437\u043E\u043A</option>\n      </select>\n      <button type=\"button\" class=\"btn btn-xs btn-success\" data-add=\"rule\">\n        <i class=\"{{= it.icons.add_rule }}\"></i> {{= it.translate(\"add_rule\") }}\n      </button>\n      {{? it.settings.allow_groups===-1 || it.settings.allow_groups>=it.level }}\n        <button type=\"button\" class=\"btn btn-xs btn-success\" data-add=\"group\">           <i class=\"{{= it.icons.add_group }}\"></i> {{= it.translate(\"add_group\") }}\n        </button>\n      {{?}}\n      {{? it.level>1 }}\n        <button type=\"button\" class=\"btn btn-xs btn-danger\" data-delete=\"group\">\n          <i class=\"{{= it.icons.remove_group }}\"></i> {{= it.translate(\"delete_group\") }}\n        </button>\n      {{?}}\n    </div>\n    <div class=\"btn-group group-conditions\">\n      {{~ it.conditions: condition }}\n        <label class=\"btn btn-xs btn-primary\">\n          <input type=\"radio\" name=\"{{= it.group_id }}_cond\" value=\"{{= condition }}\"> {{= it.translate(\"conditions\", condition) }}\n        </label>\n      {{~}}\n    </div>\n    {{? it.settings.display_errors }}\n      <div class=\"error-container\"><i class=\"{{= it.icons.error }}\"></i></div>\n    {{?}}\n  </dt>\n  <dd class=rules-group-body>\n    <ul class=rules-list></ul>\n  </dd>\n</dl>"
        }
    });
    (function () {
        var globalCache = {};
        queryBuilder.define('bt-relation', function () {
            var _this = this;
            var filtersCache = {};
            this.on('getRuleFilters.filter', function (e, rule) {
                var entity = getEntity(rule.parent);
                e.value = e.value.filter(function (filter) { return filter.id.startsWith(entity + ".") && (!filter.data || filter.data.type !== 'relation'); });
            });
            this.on('ruleToJson.filter', function (e, rule) {
                if (rule.filter.data && rule.filter.data.type === 'autocomplete') {
                    var values_1 = {};
                    rule.$el.find('.rule-value-container select option:selected').each(function () {
                        values_1[$(this).val()] = $(this).text();
                    });
                    e.value.data['values'] = values_1;
                }
            });
            this.on('afterAddGroup.QueryBuilder', function (e, group) {
                var entity = getEntity(group);
                getFilters(entity);
                if (group.data && group.data.relation) {
                    var filter = _this.getFilterById(getEntity(group.parent) + "." + group.data.relation);
                    group.$el.find('.group-conditions').append("<button class=\"btn btn-xs btn-default\"><i class=\"glyphicon\"></i>" + (filter.label || group.data.relation) + "</button>");
                }
                //$('[data-add="relation"] option[value!=""]', group.$el).remove();
                e.builder.filters
                    .filter(function (filter) { return filter.id.startsWith(entity + '.') && filter.data && filter.data.type === 'relation'; })
                    .forEach(function (filter) {
                    $('[data-add="relation"]', group.$el).append($('<option/>').text(filter.label).attr('value', filter.data.entity)
                        .attr('data-field', filter.field));
                });
                group.$el.on('change', '[data-add="relation"]', function (e) {
                    var relationSelect = $(e.currentTarget);
                    var value = relationSelect.val();
                    var option = $('option:selected', relationSelect);
                    if (value !== '') {
                        getFilters(value);
                        var root = _this.getModel(relationSelect.closest('.rules-group-container'));
                        var group_1 = _this.addGroup(root, true, {
                            'relation': option.data('field'),
                            'entity': value
                        });
                    }
                    relationSelect[0].selectedIndex = 0;
                });
            });
            var getEntity = function (group) {
                var entity;
                while (group && !entity) {
                    entity = group.data ? group.data.entity : null;
                    group = group.parent;
                }
                return entity;
            };
            var getFilters = function (entity) {
                if (filtersCache.hasOwnProperty(entity)) {
                    return filtersCache[entity];
                }
                var update = function (filters) {
                    filtersCache[entity] = filters.map(function (filter) {
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
                    return filtersCache[entity];
                };
                if (globalCache.hasOwnProperty(entity)) {
                    _this.addFilter(update(globalCache[entity]));
                }
                else {
                    RabbitCMS._ajax({
                        method: 'GET',
                        url: RabbitCMS.getPrefix() + '/query/queries/filters/' + entity,
                        async: false
                    }, function (data) {
                        globalCache[entity] = data;
                        _this.addFilter(update(data));
                    });
                }
            };
        }, {});
    })();
    var RabbitCMSQueryBuilder = (function () {
        function RabbitCMSQueryBuilder(entity, portlet) {
            var table = portlet.find('.table');
            var jQQB = $(".search-container", portlet);
            if (jQQB.length === 0)
                return;
            var defaultRules = {
                condition: 'AND',
                rules: [],
                data: {
                    entity: entity
                }
            };
            table.on('beforeSubmitFilter', function (e) {
                var result = jQQB.queryBuilder('getRules');
                if (!$.isEmptyObject(result) && !$.isEmptyObject(result.rules)) {
                    e.data = { filters: JSON.stringify(result, null, 2) };
                }
            });
            var qList = $('[name="queries-list"]', portlet);
            var qCache = {};
            qList.select2({ width: '100%' })
                .on('change', qList, function () {
                var rules = defaultRules;
                var query_id = $('option:selected', this).val();
                if (query_id !== '') {
                    if (qCache.hasOwnProperty(query_id)) {
                        rules = qCache[query_id];
                    }
                    else {
                        RabbitCMS._ajax({
                            method: 'GET',
                            url: RabbitCMS.getPrefix() + '/query/queries/rules/' + query_id,
                            async: false
                        }, function (data) {
                            qCache[query_id] = data;
                            rules = data;
                        });
                    }
                }
                jQQB.queryBuilder('clear');
                jQQB.queryBuilder('setRules', rules);
            });
            table.on('beforeResetFilter', function (e) {
                jQQB.queryBuilder("clear");
                jQQB.queryBuilder('setRules', defaultRules);
                qList.val('').trigger('change');
            });
            jQQB.queryBuilder({
                plugins: ['bt-relation', 'bt-tooltip-errors'],
                filters: [{ id: 'id' }],
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
                                RabbitCMS._ajax({
                                    url: form.attr('action'),
                                    method: 'POST',
                                    processData: false,
                                    contentType: false,
                                    data: data
                                }, function (data) {
                                    modal.modal('hide');
                                    qCache[data.id] = data.data;
                                    if (!qCache.hasOwnProperty(data.id)) {
                                        querySelect.append($('<option/>').val(data.id)
                                            .text(data.name)
                                            .prop('selected', true)).trigger('change');
                                    }
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
        }
        /**
         * @deprecated
         */
        RabbitCMSQueryBuilder.init = function (entity, portlet) {
            return new RabbitCMSQueryBuilder(entity, portlet);
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
                if (rule.filter.data && rule.filter.data.type === 'amount') {
                    input.maskMoney($.extend({
                        affixesStay: false,
                        allowZero: true
                    }, rule.filter.data.options));
                }
            });
        };
        return RabbitCMSQueryBuilder;
    }());
    return RabbitCMSQueryBuilder;
});
//# sourceMappingURL=queries.js.map