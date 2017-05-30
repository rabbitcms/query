<?php
declare(strict_types=1);

namespace RabbitCMS\Query\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Query
 *
 * @package RabbitCMS\Query\Entities
 */
class Query extends Model
{
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
