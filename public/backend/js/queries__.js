define(["jquery"], function ($) {
    "use strict";

    function table(portlet) {

        require(["jquery", "query-builder"], function($) {

            var jQQB = $("#filters-container", portlet);
            var queryBuilder = $.fn.queryBuilder;

            queryBuilder.defaults({
                templates: {
                    group: MicroEvent.getGroupTemplate()
                }
            });

            queryBuilder.define('bt-relation', function () {
                var self = this;

                self.on('getRuleFilters.filter', function(e, rule) {
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
                                $('[data-add="relation"]', rule.parent.$el).append(
                                    $('<option/>').text(filter.label).attr('value', filter.data.entity)
                                        .attr('data-field', filter.field)
                                );
                                return false;
                            } else {
                                return true;
                            }
                        }

                        return false;
                    });
                });

                portlet.on('change', '[data-add="relation"]', function () {
                    var _this = $(this);
                    var value = _this.val();
                    var option = $('option:selected', _this);

                    if (value !== '') {
                        MicroEvent.getFilters(value, jQQB);

                        var root = jQQB.queryBuilder('getModel', _this.closest('.rules-group-container'));
                        var group = jQQB.queryBuilder('addGroup', root, true, {'relation': option.data('field'), 'entity': value});
                        group.$el.find('.group-conditions').append('<button class="btn btn-xs btn-default"><i class="glyphicon"></i>' + option.text() + '</button>');
                    }

                    _this[0].selectedIndex = 0;
                });

                this.on('beforeAddGroup', function (event, parent, addRule, level) {});

                this.on('validationError.queryBuilder', function(e, rule, error, value) {
                    $.each(error, function (key, value) {
                        if (value === 'empty_group') {
                            e.preventDefault();
                        }
                    });
                });


            }, { });

            jQQB.queryBuilder({
                plugins: ['bt-relation', 'bt-tooltip-errors'],
                filters: MicroEvent.getDefaultFilters(),
                allow_empty: true
            });

            $('.get-rules', portlet).on('click', function () {
                var result = jQQB.queryBuilder('getRules');

                var json = {};
                if (!$.isEmptyObject(result)) {
                    json = JSON.stringify(result, null, 2);
                    $('#result', portlet).text(json + '\n\n\n');

                    RabbitCMS._ajax(
                        {
                            method: 'POST',
                            url: RabbitCMS.getPrefix() + '/queries/queries',
                            data: {
                                json: json
                            },
                            async: false
                        }, function (data) {
                            $('#result', portlet).append(data);
                        }
                    );
                }
            });

            $('#entities_select', portlet).on('change', function () {
                var value = $(this).val();

                if (value !== '') {
                    jQQB.queryBuilder("clear");
                    jQQB.queryBuilder('setRoot', false, {'entity': value});

                    MicroEvent.getFilters(value, jQQB);
                }
            });

            jQQB.on('afterUpdateRuleOperator.queryBuilder', function(e, rule) {
                var $input = rule.$el.find('.rule-value-container [name*=_value_]');
                var input_type = rule.filter.input;

                $.each($input, function () {
                    var input = $(this);

                    if (input_type === 'select') {
                        input.select2('destroy');
                        input.prop('multiple', false);
                        input.val('');
                        if (rule.filter.multiple && (rule.operator.type === 'in' || rule.operator.type === 'not_in')) {
                            input.prop('multiple', true);
                        }

                        console.log(rule);
                        if (rule.filter.data && rule.filter.data.type === 'autocomplete') {

                            input.attr('style', 'width: 250px;');

                            input.select2({
                                lang: 'ua',
                                placeholder: 'Пошук користувача',
                                minimumInputLength: 3,
                                id: function (bond) {
                                    return bond.id;
                                },
                                ajax: {
                                    url: RabbitCMS.getPrefix() + '/queries/queries/values',
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
                                    return item.value || item.id;
                                },
                                escapeMarkup: function (markup) {
                                    return markup;
                                }
                            });

                        } else {
                            input.select2();
                        }
                    }
                });
            });


            jQQB.on('getRuleInput.queryBuilder.filter', function(e, h, rule, name) {});

            jQQB.on('afterCreateRuleInput.queryBuilder', function(e, rule) {
                var $input = rule.$el.find('.rule-value-container [name*=_value_]');
                var type = rule.filter.type;
                var input_type = rule.filter.input;

                $.each($input, function () {
                    var input = $(this);

                    if (input_type === 'select') {
                        input.prop('multiple', false);
                        if (rule.filter.multiple && (rule.operator.type === 'in' || rule.operator.type === 'not_in')) {
                            input.prop('multiple', true);
                        }

                        input.select2();
                    }

                    switch (type) {
                        case 'datetime':
                            input.datetimepicker({});
                            return;
                        case 'date':
                            input.datepicker({});
                            return;
                    }
                });
            });
        });
    }

    var filtersCache = {};
    function getFilters(relation, jQQB) {
        if (filtersCache.hasOwnProperty(relation)) {
            return false;
        }

        RabbitCMS._ajax(
            {
                method: 'GET',
                url: RabbitCMS.getPrefix() + '/queries/queries/filters/' + relation,
                async: false
            }, function (data) {
                filtersCache[relation] = data;

                jQQB.queryBuilder("addFilter", data);
            }
        );
    }

    function getDefaultFilters() {
        return [
            {
                id: 'name',
                label: 'Name',
                type: 'string'
            }
        ]
    }

    function getGroupTemplate() {
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
    }

    var MicroEvent = new RabbitCMS.MicroEvent(
        {
            table: table,
            getGroupTemplate: getGroupTemplate,
            getDefaultFilters: getDefaultFilters,
            getFilters: getFilters
        }
    );

    return MicroEvent;
});