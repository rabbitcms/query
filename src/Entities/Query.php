<?php
declare(strict_types=1);

namespace RabbitCMS\Query\Entities;

use DKulyk\Eloquent\Extensions\Concerns\HasUUIDKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Query
 *
 * @package RabbitCMS\Query\Entities
 * @property array $data
 */
class Query extends Model
{
    use SoftDeletes;
    use HasUUIDKey;

    protected $table = 'queries';

    protected $fillable = [
        'name',
        'entity',
        'data'
    ];

    protected $casts = [
        'data' => 'array'
    ];
}
