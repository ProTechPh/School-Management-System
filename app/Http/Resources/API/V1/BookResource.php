<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class BookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school' => new SchoolResource($this->whenLoaded('school')),
            'isbn' => $this->isbn,
            'title' => $this->title,
            'author' => $this->author,
            'publisher' => $this->publisher,
            'publication_year' => $this->publication_year,
            'edition' => $this->edition,
            'category' => $this->category,
            'subject' => $this->subject,
            'language' => $this->language,
            'pages' => $this->pages,
            'description' => $this->description,
            'cover_image' => $this->cover_image,
            'is_reference' => $this->is_reference,
            'is_active' => $this->is_active,
            'copies' => BookCopyResource::collection($this->whenLoaded('copies')),
            'available_copies_count' => $this->when(isset($this->copies), function () {
                return $this->copies->where('status', 'available')->count();
            }),
            'total_copies_count' => $this->when(isset($this->copies), function () {
                return $this->copies->count();
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
