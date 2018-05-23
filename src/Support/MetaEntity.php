<?php
declare(strict_types=1);

namespace RabbitCMS\Query\Support;

use DKulyk\Eloquent\Query\Contracts\QueryManager;
use DKulyk\Eloquent\Query\Entity;
use DKulyk\Eloquent\Query\Field;
use DKulyk\Eloquent\Query\Manager;
use DKulyk\Eloquent\Query\Types;

/**
 * Class MetaEntity
 * @package RabbitCMS\Query\Support
 */
class MetaEntity extends Entity
{
    /**
     * @var array
     */
    private $data;

    /**
     * MetaEntity constructor.
     *
     * @param array $data
     */
    public function __construct(array $data)
    {
        $class = $data['class'];
        parent::__construct(new $class(), $data['table']);
        $this->data = $data;
    }

    protected function init()
    {
        /** @var Manager $manager */
        $manager = app(QueryManager::class);

        foreach ($this->data['fields'] as $data) {
            $type = null;
            switch ($data['type'] ?? '') {
                case 'relation':
                    try {
                        $type = new Types\Relation($manager->get($data['relation']));
                    } catch (\RuntimeException $e) {
                        continue 2;
                    }
                    break;
                case 'enum':
                    $enum = $data['enum'] ?? [];
                    if (is_array($enum)) {
                        $type = new Types\Enum(array_reduce($enum, function (array $r, $a) {
                            if (is_array($a)) {
                                $r[$a['value']] = $a['caption'] ?? $a['value'];
                            } else {
                                $r[$a] = $a;
                            }
                            return $r;
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

            }
            $this->addFields(new Field($data['name'], $data['caption'] ?? $data['name'], $type,
                $data['filters'] ?? []));
        }
    }
}