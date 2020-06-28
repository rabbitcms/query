<?php

declare(strict_types=1);

namespace RabbitCMS\Query\Entities;

use DKulyk\Eloquent\Extensions\Concerns\HasUUIDKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Query
 *
 * @property-read int $id
 * @property-read string $uuid
 * @property bool $hiddend
 * @property array $data
 * @property string $name
 * @property string $entity
 */
class Query extends Model
{
    use SoftDeletes;
    use HasUUIDKey;

    protected $table = 'queries';

    protected $fillable = [
        'name',
        'entity',
        'data',
        'hidden',
    ];

    protected $casts = [
        'data' => 'array',
        'hidden' => 'bool',
    ];

    public static function boot()
    {
        parent::boot();
        self::saving(fn(Query $query) => $query->setAttribute('hash', md5($query->getAttributes()['data'])));
    }
}
