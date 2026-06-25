<?php

namespace Tests\Unit\Services;

use App\Services\Integrations\AssistantPrompts;
use PHPUnit\Framework\TestCase;

class AssistantPromptsTest extends TestCase
{
    public function test_preferences_instructions_includes_gastronomy_quota_for_local_food_tag(): void
    {
        $block = AssistantPrompts::preferencesInstructions(['gastronomie locale']);

        $this->assertStringContainsString('PRÉFÉRENCE GASTRONOMIE', $block);
        $this->assertStringContainsString('au moins 1 activité gastronomique par jour', $block);
        $this->assertStringContainsString('nom du lieu dans le title', $block);
    }

    public function test_preferences_instructions_includes_gastronomy_for_profile_tags(): void
    {
        foreach (['gastronomie', 'streetfood', 'gastro'] as $tag) {
            $block = AssistantPrompts::preferencesInstructions([$tag]);
            $this->assertStringContainsString('PRÉFÉRENCE GASTRONOMIE', $block, "Tag {$tag} should trigger gastronomy block");
        }
    }

    public function test_preferences_instructions_omits_gastronomy_without_food_tags(): void
    {
        $block = AssistantPrompts::preferencesInstructions(['aventure', 'detente']);

        $this->assertStringNotContainsString('PRÉFÉRENCE GASTRONOMIE', $block);
    }

    public function test_duration_guidelines_require_mandatory_duration_hours(): void
    {
        $block = AssistantPrompts::durationGuidelinesInstructions();

        $this->assertStringContainsString('durationHours', $block);
        $this->assertStringContainsString('OBLIGATOIRE', $block);
        $this->assertStringContainsString('safari', $block);
        $this->assertStringContainsString('3 – 6 h', $block);
        $this->assertStringContainsString('jamais', $block);
    }

    public function test_geo_instructions_include_mandatory_duration_hours(): void
    {
        $block = AssistantPrompts::geoInstructions('Ouagadougou', AssistantPrompts::REFUSAL_TEXT);

        $this->assertStringContainsString('"durationHours": number', $block);
        $this->assertStringNotContainsString('durationHours": number optionnel', $block);
        $this->assertStringContainsString('DURÉES D\'ACTIVITÉ (OBLIGATOIRE)', $block);
    }

    public function test_regenerate_activity_instructions_include_duration_guidelines(): void
    {
        $block = AssistantPrompts::regenerateActivityInstructions('Safari photo', 12.37, -1.52, 2, 'Ouagadougou');

        $this->assertStringContainsString('"durationHours": number (> 0)', $block);
        $this->assertStringContainsString('DURÉES D\'ACTIVITÉ (OBLIGATOIRE)', $block);
    }

    public function test_replan_instructions_include_duration_guidelines(): void
    {
        $block = AssistantPrompts::replanInstructions(
            'Ouagadougou',
            'weather',
            'Pluie',
            3,
            [],
            [1, 2],
        );

        $this->assertStringContainsString('"durationHours": number', $block);
        $this->assertStringContainsString('DURÉES D\'ACTIVITÉ (OBLIGATOIRE)', $block);
    }
}
