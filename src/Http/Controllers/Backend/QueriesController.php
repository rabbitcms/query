<?php
declare(strict_types=1);

namespace RabbitCMS\Query\Http\Controllers\Backend;

use DKulyk\Eloquent\Query\Entity;
use DKulyk\Eloquent\Query\Manager;
use DKulyk\Eloquent\Query\Types\AutoComplete;
use Illuminate\Database\Eloquent\MassAssignmentException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\View\View;
use RabbitCMS\Backend\Annotation\Permissions;
use RabbitCMS\Query\Entities;

/**
 * Class QueriesController
 *
 * @Permissions("queries.queries.read")
 */
class QueriesController extends Controller
{
    /**
     * @return View
     *
     * @Permissions("queries.queries.write")
     */
    public function getSave(): View
    {
        return $this->view('backend.form');
    }

    /**
     * @param Request $request
     *
     * @throws ModelNotFoundException
     * @throws MassAssignmentException
     *
     * @return JsonResponse
     *
     * @Permissions("queries.queries.write")
     */
    public function postSave(Request $request): JsonResponse
    {
        $query = $request->has('id') ? Entities\Query::query()
            ->findOrFail($request->input('id')) : new Entities\Query();

        $data = $request->only(['name', 'entity']);
        $data['data'] = json_decode($request->input('data', '{}'));
        $query->fill($data)
            ->save();

        return Response::json($query->toArray(), 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param $entity
     * @param Manager $manager
     *
     * @return JsonResponse
     *
     * @throws \RuntimeException
     */
    public function getFilters($entity, Manager $manager): JsonResponse
    {
        /* @var Entity $query_entity */
        $query_entity = $manager->get((string) $entity);

        return Response::json($query_entity->getFilters(), 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param Request $request
     * @param Manager $manager
     *
     * @return array
     *
     * @throws \RuntimeException
     */
    public function getValues(Request $request, Manager $manager): array
    {
        try {
            $entity = $manager->get((string) $request->input('entity'));

            $type = $entity->getField($request->input('field'))
                ->getType();
            if ($type instanceof AutoComplete) {
                return $type->getValues((string) $request->input('term'));
            }

            return [];
        } catch (\RuntimeException $exception) {
            return [];
        }
    }

    /**
     * @param $id
     *
     * @return JsonResponse
     *
     * @throws ModelNotFoundException
     */
    public function getRules($id): JsonResponse
    {
        /* @var Entities\Query $query */
        $query = Entities\Query::query()
            ->findOrFail($id);

        return Response::json($query->data, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
