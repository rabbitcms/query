<?php
declare(strict_types=1);

use RabbitCMS\Backend\Support\Backend;

return [
    'boot' => function (Backend $backend) {
        $backend->addAclResolver(
            function (Backend $backend) {
                $backend->addAclGroup('queries', trans('query::acl.module'));
                $backend->addAcl('queries', 'queries.read', trans('query::acl.queries.read'));
                $backend->addAcl('queries', 'queries.write', trans('query::acl.queries.write'));
            }
        );
    },
    'requirejs' => [
        'rabbitcms/queries' => [
            'path' => 'js/queries',
            'deps' => 'rabbitcms.backend'
        ],
        'query-builder' => [
            'path' => 'js/query-builder'
        ],
        'jQuery.extendext' => [
            'path' => 'js/jQuery.extendext'
        ],
        'doT' => [
            'path' => 'js/doT'
        ]
    ]
];
