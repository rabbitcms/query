<?php

declare(strict_types=1);

namespace RabbitCMS\Query;

use DKulyk\Eloquent\Query\Contracts\QueryManager;
use DKulyk\Eloquent\Query\Query;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use RabbitCMS\Carrot\Support\Grid2;
use RabbitCMS\Modules\Facades\Modules;
use RabbitCMS\Modules\Module;
use RabbitCMS\Query\Support\MetaEntity;
use RabbitCMS\Query\View\Components\QueryComponent;
use Symfony\Component\Yaml\Yaml;

/**
 * Class ModuleProvider.
 */
class ModuleProvider extends ServiceProvider
{
    /**
     * Perform post-registration booting of services.
     */
    public function boot(): void
    {
        Blade::directive('query', function ($expression) {
            return "<?php echo get_query_builder({$expression}); ?>";
        });

        Blade::component('query', QueryComponent::class);

        $this->app->afterResolving(QueryManager::class, function (QueryManager $manager) {
            array_map(function (Module $module) use ($manager) {
                $path = $module->getPath('config/query.yml');
                if (is_file($path)) {
                    $yml = Yaml::parseFile($path);
                    foreach ($yml as $table) {
                        $meta = new MetaEntity($table);
                        if ($manager->has($meta->getName())) {
                            $manager->get($meta->getName())->appendData($table);
                        } else {
                            $manager->register($meta);
                        }
                    }
                }
            }, Modules::enabled());
        });

        Grid2::addHandler(function (Builder $query, Request $request) {
            $json = $request->input('qBuilder');
            if (empty($json)) {
                return;
            }

            if (preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/', $json)) {
                $json = \RabbitCMS\Query\Entities\Query::query()->where('uuid', $json)->first()->getRawOriginal('data');
            }

            if ($json) {
                $json = json_decode($json, true);
                $manager = app(QueryManager::class);
                (new Query($manager->get($json['data']['entity']), $json))
                    ->buildQuery($query);
            }

        });
    }
}
