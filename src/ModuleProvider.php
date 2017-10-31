<?php
declare(strict_types=1);

namespace RabbitCMS\Query;

use DKulyk\Eloquent\Query\Manager;
use DKulyk\Eloquent\Query\Query;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use RabbitCMS\Carrot\Support\Grid2;

/**
 * Class ModuleProvider.
 */
class ModuleProvider extends ServiceProvider
{
    /**
     * Perform post-registration booting of services.
     *
     * @param Manager $manager
     */
    public function boot(Manager $manager):void
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
