<?php
declare(strict_types=1);

namespace RabbitCMS\Query\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Query
 *
 * @package RabbitCMS\Query\Entities
 */
class Query extends Model
{
    use SoftDeletes;

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
