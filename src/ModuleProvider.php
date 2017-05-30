<?php
declare(strict_types=1);

namespace RabbitCMS\Query;

use DKulyk\Eloquent\Query\Manager;
use DKulyk\Eloquent\Query\Query;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use RabbitCMS\Carrot\Support\Grid2;
use RabbitCMS\Modules\ModuleProvider as BaseModuleProvider;

/**
 * Class ModuleProvider.
 */
class ModuleProvider extends BaseModuleProvider
{
    /**
     * @return string
     */
    public function name(): string
    {
        return 'query';
    }

    /**
     * Perform post-registration booting of services.
     *
     * @return void
     *
     * @throws \RuntimeException
     */
    public function boot(Manager $manager)
    {
        Blade::directive('query', function ($expression) {
            return "<?php echo get_query_builder({$expression}); ?>";
        });

        Grid2::addHandler(function (Builder $query, Request $request) use ($manager) {
            $json = $request->input('qBuilder');
            if ($json) {
                $json = json_decode($json, true);
                (new Query($manager->get($json['data']['entity']), $json))
                    ->buildQuery($query);
            }
        });
    }
}
