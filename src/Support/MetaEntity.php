<?php

declare(strict_types=1);

namespace RabbitCMS\Query\Support;

use DKulyk\Enum\Enum;
use DKulyk\Eloquent\Query\{Entity, Field, Manager, Types};
use DKulyk\Eloquent\Query\Contracts\QueryManager;
use Illuminate\Database\Eloquent\{Builder, Model};

/**
 * Class MetaEntity
 *
 * @package RabbitCMS\Query\Support
 */
class MetaEntity extends Entity
{
    /**
     * @var array
     */
    private $data = [];

    /**
     * MetaEntity constructor.
     *
     * @param  array  $data
     */
    public function __construct(array $data)
    {
        $class = $data['class'];
        $model = new $class();
        parent::__construct($model, $data['table'] ?? $model->getTable());
        $this->data = [$data];
    }

    public function appendData(array $data): self
    {
        $this->data[] = $data;

        return $this;
    }

    protected function init()
    {
        /** @var Manager $manager */
        $manager = app(QueryManager::class);

        foreach ($this->data as $datum) {
            foreach ($datum['fields'] as $data) {
                $type = null;
                foreach ($data['when'] ?? [] as $rule) {
                    switch ($rule['type']) {
                        case 'class_exists':
                        case 'class':
                            if (! class_exists($rule['class'])) {
                                continue 3;
                            }
                            break;
                    }
                }
                switch ($data['type'] ?? '') {
                    case 'relation':
                        try {
                            $type = new Types\Relation(
                                $manager->get($data['relation'] ?? $this->model->{$data['name']}()->getModel()->getTable())
                            );
                        } catch (\RuntimeException $e) {
                            continue 2;
                        }
                        break;
                    case 'distinct':
                        $type = new Types\Enum(
                            $this->model->newQuery()->distinct()->pluck($data['name'], $data['name'])->all()
                        );
                        break;
                    case 'enum':
                        $enum = $data['enum'] ?? [];
                        if (is_array($enum)) {
                            $type = new Types\Enum($enum);
                            break;
                        } elseif (! is_string($data['enum'])) {
                            continue 2;
                        }
                        if (strpos($data['enum'], '@', 1) !== false) {
                            $type = new Types\AutoComplete(function (string $term) use ($data) {
                                $result = app()->call($data['enum'], ['term' => $term]);
                                if (empty($result) || ! is_array($result)) {
                                    return [];
                                }
                                if (is_array(reset($result))) {
                                    return $result;
                                }

                                return array_map(function ($text, $id) {
                                    return compact('id', 'text');
                                }, $result, array_keys($result));
                            });
                            break;
                        } elseif (is_subclass_of($data['enum'], Enum::class, true)) {
                            /** @var Enum $class */
                            $class = $data['enum'];
                            $type = new Types\Enum(array_reduce($class::values(), function (array $values, Enum $type) {
                                $values[$type->getValue()] = method_exists($type, 'getCaption')
                                    ? $type->getCaption()
                                    : $type->getKey();

                                return $values;
                            }, []));
                        } elseif (is_subclass_of($data['enum'], Model::class, true)) {
                            /** @var Model $class */
                            $class = $data['enum'];
                            $type = new Types\Enum($class::query()
                                ->when($data['where'] ?? null, function (Builder $builder, array $where) {
                                    $builder->where($where);
                                })
                                ->get()
                                ->reduce(function (array $values, Model $model) use ($data
                                ) {
                                    $values[$model->getKey()] = method_exists($model, 'getCaption')
                                        ? $model->getCaption()
                                        : (array_key_exists('title', $data)
                                            ? $model->getAttribute($data['title'])
                                            : $model->getKey()
                                        );

                                    return $values;
                                }, []));
                        }
                        break;
                    case 'date':
                        $type = new Types\Date(
                            $data['format'] ?? 'd.m.Y',
                            $data['printFormat'] ?? 'dd.mm.yyyy',
                            $data['options'] ?? []
                        );
                        break;

                    case 'datetime':
                        $type = new Types\DateTime(
                            $data['format'] ?? 'd.m.Y H:i',
                            $data['printFormat'] ?? 'dd.mm.yyyy hh:ii',
                            $data['options'] ?? []
                        );
                        break;
                    case 'amount':
                        $type = new Types\Amount(
                            (int) ($data['precision'] ?? 2),
                            (int) ($data['multiplier'] ?? 1),
                            (array) ($data['options'] ?? [])
                        );
                        break;
                    default:
                        if (is_subclass_of($data['type'] ?? '', Types\AbstractType::class)) {
                            $class = $data['type'];
                            $type = new $class(...(array) ($data['args'] ?? []));
                        }
                        break;
                }
                $field = new Field($data['name'], $data['caption'] ?? $data['name'], $type, $data['filters'] ?? []);

                if (array_key_exists('withoutScopes', $data)) {
                    $field->withoutScopes((array) $data['withoutScopes']);
                }

                $this->addFields($field);
            }
        }
    }
}
