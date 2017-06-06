import * as $ from "jquery";
import "query-builder";

var queryBuilder = $.fn.queryBuilder;

queryBuilder.defaults({
    templates: {
        group: `
<dl id="{{= it.group_id }}" class="rules-group-container">
  <dt class="rules-group-header">
    <div class="btn-group pull-right group-actions">
      <select data-add="relation">
        <option value="">Зв'язок</option>
      </select>
      <button type="button" class="btn btn-xs btn-success" data-add="rule">
        <i class="{{= it.icons.add_rule }}"></i> {{= it.translate("add_rule") }}
      </button>
      {{? it.settings.allow_groups===-1 || it.settings.allow_groups>=it.level }}
        <button type="button" class="btn btn-xs btn-success" data-add="group"> \
          <i class="{{= it.icons.add_group }}"></i> {{= it.translate("add_group") }}
        </button>
      {{?}}
      {{? it.level>1 }}
        <button type="button" class="btn btn-xs btn-danger" data-delete="group">
          <i class="{{= it.icons.remove_group }}"></i> {{= it.translate("delete_group") }}
        </button>
      {{?}}
    </div>
    <div class="btn-group group-conditions">
      {{~ it.conditions: condition }}
        <label class="btn btn-xs btn-primary">
          <input type="radio" name="{{= it.group_id }}_cond" value="{{= condition }}"> {{= it.translate("conditions", condition) }}
        </label>
      {{~}}
    </div>
    {{? it.settings.display_errors }}
      <div class="error-container"><i class="{{= it.icons.error }}"></i></div>
    {{?}}
  </dt>
  <dd class=rules-group-body>
    <ul class=rules-list></ul>
  </dd>
</dl>`
    }
});

(() => {
    let globalCache = {};
    queryBuilder.define('bt-relation', function () {
        let filtersCache = {};

        this.on('getRuleFilters.filter', (e, rule) => {
            let entity = getEntity(rule.parent);
            e.value = e.value.filter(filter => filter.id.startsWith(`${entity}.`) && (!filter.data || filter.data.type !== 'relation'));
        });

        this.on('ruleToJson.filter', function (e, rule) {
            if (rule.filter.data && rule.filter.data.type === 'autocomplete') {
                let values = {};
                rule.$el.find('.rule-value-container select option:selected').each(function () {
                    values[$(this).val()] = $(this).text();
                });

                e.value.data['values'] = values;
            }
        });

        this.on('afterAddGroup.QueryBuilder', (e, group) => {
            let entity = getEntity(group);
            getFilters(entity);
            if (group.data && group.data.relation) {
                group.$el.find('.group-conditions').append(
                    `<button class="btn btn-xs btn-default"><i class="glyphicon"></i>${group.data.label || group.data.relation}</button>`
                );
            }

            //$('[data-add="relation"] option[value!=""]', group.$el).remove();
            e.builder.filters
                .filter(filter => filter.id.startsWith(entity + '.') && filter.data && filter.data.type === 'relation')
                .forEach((filter) => {
                    $('[data-add="relation"]', group.$el).append(
                        $('<option/>').text(filter.label).attr('value', filter.data.entity)
                            .attr('data-field', filter.field)
                    );
                });

            group.$el.on('change', '[data-add="relation"]', (e) => {
                let relationSelect = $(e.currentTarget);
                let value = relationSelect.val();
                let option = $('option:selected', relationSelect);

                if (value !== '') {
                    getFilters(value);

                    let root = this.getModel(relationSelect.closest('.rules-group-container'));
                    let group = this.addGroup(root, true, {
                        'relation': option.data('field'),
                        'entity': value,
                        'label': option.text()
                    });

                }

                relationSelect[0].selectedIndex = 0;
            });
        });

        let getEntity = (group): string => {
            let entity;
            while (group && !entity) {
                entity = group.data ? group.data.entity : null;
                group = group.parent;
            }

            return entity;
        };

        let getFilters = (entity) => {
            if (filtersCache.hasOwnProperty(entity)) {
                return filtersCache[entity];
            }
            let update = (filters) => {
                filtersCache[entity] = filters.map(function (filter) {
                    if (filter.data && filter.data.type === 'autocomplete') {
                        filter.valueSetter = function (rule, value) {
                            let select = rule.$el.find('.rule-value-container select');
                            select.empty();
                            value.forEach((item) => {
                                if (item) {
                                    select.append(
                                        $('<option/>').val(item)
                                            .text(rule.data.values[item] || item)
                                            .prop('selected', true)
                                    );
                                }
                            });
                        }
                    }

                    return filter;
                });

                return filtersCache[entity];
            };

            if (globalCache.hasOwnProperty(entity)) {
                this.addFilter(update(globalCache[entity]));
            } else {
                RabbitCMS._ajax({
                    method: 'GET',
                    url: RabbitCMS.getPrefix() + '/query/queries/filters/' + entity,
                    async: false
                }, (data) => {
                    globalCache[entity] = data;
                    this.addFilter(update(data));
                });
            }
        };
    }, {});
})();

class RabbitCMSQueryBuilder {
    /**
     * @deprecated
     */
    static init(entity, portlet) {
        return new RabbitCMSQueryBuilder(entity, portlet);
    }

    constructor(entity, portlet) {
        let table = portlet.find('.table');
        let jQQB = $(".search-container", portlet);
        const defaultRules = {
            condition: 'AND',
            rules: [],
            data: {
                entity: entity
            }};

        table.on('beforeSubmitFilter', function (e) {
            let result = jQQB.queryBuilder('getRules');

            if (!$.isEmptyObject(result) && !$.isEmptyObject(result.rules)) {
                e.data = {filters: JSON.stringify(result, null, 2)};
            }
        });

        table.on('beforeResetFilter', function (e) {
            jQQB.queryBuilder("clear");
            jQQB.queryBuilder('setRoot', false, defaultRules);
        });

        portlet.on('change', '[name="queries-list"]', function () {
            jQQB.queryBuilder('clear');
            jQQB.queryBuilder('setRules', $('option:selected', this).data('rules') || defaultRules);
        });


        jQQB.queryBuilder({
            plugins: ['bt-relation', 'bt-tooltip-errors'],
            filters: [{id: 'id'}],
            allow_empty: true,
            rules: defaultRules
        });


        jQQB.on('afterUpdateRuleOperator.queryBuilder', this.updateRules);

        jQQB.on('afterCreateRuleInput.queryBuilder', this.updateRules);

        portlet.on('click', '[rel="save-query"]', function () {
            let querySelect = $('[name="queries-list"]', portlet);

            RabbitCMS.loadModalWindow(RabbitCMS.getPrefix() + '/query/queries/save', function (modal) {
                let form = $('form', modal);

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
                        let result = jQQB.queryBuilder('getRules');
                        form = (form instanceof $) ? form : $(form);

                        if (!$.isEmptyObject(result) && !$.isEmptyObject(result.rules)) {
                            let data = new FormData(form[0]);
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

    updateRules(e, rule) {
        let value_container = rule.$el.find('.rule-value-container [name*=_value_]');
        let filter_type = rule.filter.type;
        let input_type = rule.filter.input;

        $.each(value_container, function () {
            let input = $(this);

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
                } else {
                    input.select2();
                }

            }

            if (rule.filter.data && rule.filter.data.type === 'amount') {
                input.maskMoney($.extend({
                    thousands: ' ',
                    decimal: '.',
                    affixesStay: false,
                    allowZero: true
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
    }
}

export = RabbitCMSQueryBuilder;
