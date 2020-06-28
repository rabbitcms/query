<?php

declare(strict_types=1);

namespace RabbitCMS\Query\Http\Controllers\Backend;


use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use RabbitCMS\Query\Entities\Query;

class QueryContorller extends Controller
{
    public function store(Request $request)
    {
        $data = $request->input();

        $query = new Query([
            'data' => $data,
        ]);

        $query = $query->newQuery()
            ->where('hash', md5($query->getAttributes()['data']))
            ->where('data', $query->getAttributes()['data'])
            ->firstOrCreate([
                'entity' => $data['data']['entity'],
            ], [
                'hidden' => true,
                'name' => 'tmp',
                'data' => $data,
            ]);

        return ['uuid' => $query->uuid];
    }
}
